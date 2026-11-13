import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
    Tablet, ShieldCheck, Clock, CheckCircle2, Ban, Plus, RefreshCw, 
    X, Loader2, Sparkles, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { posDeviceManager, PosDevice } from '../utils/posDeviceManager';
import { parseAppSettings } from '../utils/appSettingsUtils';

interface AdminPosDevicesViewProps {
    onDevicesUpdated?: (count: number) => void;
}

export const AdminPosDevicesView: React.FC<AdminPosDevicesViewProps> = ({ onDevicesUpdated }) => {
    const [devices, setDevices] = useState<PosDevice[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Modal state for manual addition
    const [showModal, setShowModal] = useState(false);
    const [manualDeviceId, setManualDeviceId] = useState('');
    const [manualBranch, setManualBranch] = useState('السويدي الغربي');
    const [manualDeviceName, setManualDeviceName] = useState('تابلت كاشير');
    const [isSavingManual, setIsSavingManual] = useState(false);

    const loadDevices = async () => {
        setLoading(true);
        try {
            const list = await posDeviceManager.getDevices();
            setDevices(list);
            const pendingCount = list.filter(d => d.status === 'pending').length;
            onDevicesUpdated?.(pendingCount);
        } catch (e) {
            console.error('[AdminPosDevicesView] load error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();

        // Realtime listener for device approval/request changes
        const channel = supabase
            .channel('admin_pos_devices_component')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
                (payload) => {
                    const parsed = parseAppSettings(payload.new);
                    const list = (parsed.authorized_pos_devices || []) as PosDevice[];
                    setDevices(list);
                    const pendingCount = list.filter(d => d.status === 'pending').length;
                    onDevicesUpdated?.(pendingCount);
                }
            )
            .subscribe();

        const interval = setInterval(loadDevices, 4000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    const handleApprove = async (deviceId: string) => {
        setActionLoadingId(deviceId);
        try {
            const ok = await posDeviceManager.approveDevice(deviceId);
            if (ok) {
                toast.success(`تم تفويض واعتماد التابلت (${deviceId}) بنجاح! 🔒`);
                await loadDevices();
            } else {
                toast.error('تعذر اعتماد الجهاز');
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleReject = async (deviceId: string) => {
        setActionLoadingId(deviceId);
        try {
            const ok = await posDeviceManager.rejectDevice(deviceId);
            if (ok) {
                toast.success(`تم رفض طلب الجهاز (${deviceId})`);
                await loadDevices();
            } else {
                toast.error('تعذر رفض الطلب');
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRevoke = async (deviceId: string) => {
        if (!confirm(`هل أنت متأكد من رغبتك في إلغاء صلاحية هذا التابلت (${deviceId})؟ سيتم حظره من فتح الكاشير فوراً.`)) {
            return;
        }
        setActionLoadingId(deviceId);
        try {
            const ok = await posDeviceManager.revokeDevice(deviceId);
            if (ok) {
                toast.success(`تم حظر وإلغاء صلاحية التابلت (${deviceId})`);
                await loadDevices();
            } else {
                toast.error('تعذر حظر الجهاز');
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = manualDeviceId.trim().toUpperCase();
        if (!trimmed) {
            toast.error('يرجى إدخال معرّف الجهاز (Device ID)');
            return;
        }
        setIsSavingManual(true);
        try {
            await posDeviceManager.addManualApprovedDevice(trimmed, manualBranch, manualDeviceName);
            toast.success(`تمت إضافة وتفعيل التابلت (${trimmed}) بنجاح! 🚀`);
            setManualDeviceId('');
            setShowModal(false);
            await loadDevices();
        } catch {
            toast.error('حدث خطأ أثناء الإضافة');
        } finally {
            setIsSavingManual(false);
        }
    };

    const pendingDevices = devices.filter(d => d.status === 'pending');
    const approvedDevices = devices.filter(d => d.status === 'approved');
    const blockedDevices = devices.filter(d => d.status === 'blocked');

    return (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-6 text-right" dir="rtl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Tablet className="text-primary" size={22} />
                        <span>أجهزة وتابلت الكاشير المصرح لها (POS Devices)</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        تأمين الكاشير ومنع فتحه إلا من الأجهزة اللوحية المعتمدة رسمياً دون الحاجة لمشاركة كلمة سر الإدارة مع الموظفين.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadDevices}
                        className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl transition-all border border-white/10 text-xs flex items-center gap-1.5 cursor-pointer font-bold"
                        title="تحديث قائمة الأجهزة"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
                        <span>تحديث</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>+ اعتماد تابلت مسبقاً</span>
                    </button>
                </div>
            </div>

            {/* 1. Pending Requests Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Clock size={16} />
                        <span>طلبات الاعتماد الجديدة بانتظار موافقتك:</span>
                        {pendingDevices.length > 0 && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-amber-500/30 animate-pulse">
                                {pendingDevices.length} معلق
                            </span>
                        )}
                    </h4>
                </div>

                {pendingDevices.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500 bg-zinc-800/20 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                        <ShieldCheck size={24} className="text-gray-600 mb-1" />
                        <span>لا توجد طلبات اعتماد معلقة حالياً — كل الأجهزة مضبوطة ومؤمّنة ✨</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingDevices.map(dev => (
                            <div
                                key={dev.id || dev.device_id}
                                className="bg-gradient-to-br from-amber-500/10 via-zinc-800/80 to-zinc-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg shadow-amber-500/5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                                            <span className="font-mono font-black text-lg text-amber-400 tracking-wider">
                                                {dev.device_id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white font-bold mt-1.5">
                                            الفرع المطلوب: <span className="text-primary underline">{dev.branch_name || 'غير محدد'}</span>
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            وقت الطلب: {new Date(dev.requested_at).toLocaleString('ar-SA')}
                                        </p>
                                    </div>
                                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold border border-amber-500/30">
                                        معلق ⏳
                                    </span>
                                </div>

                                <div className="flex gap-2.5 pt-2 border-t border-white/10 relative z-10">
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === dev.device_id}
                                        onClick={() => handleApprove(dev.device_id)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50 active:scale-98"
                                    >
                                        {actionLoadingId === dev.device_id ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 size={16} />
                                                <span>موافقة وتفعيل التابلت فوراً</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === dev.device_id}
                                        onClick={() => handleReject(dev.device_id)}
                                        className="px-4 bg-zinc-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-bold py-2.5 rounded-xl text-xs transition-colors border border-white/5 cursor-pointer disabled:opacity-50"
                                    >
                                        رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Active Approved Devices Section */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck size={17} />
                        <span>الأجهزة المعتمدة والمصرح لها بالدخول للكاشير:</span>
                        <span className="text-gray-400 text-xs font-normal">
                            ({approvedDevices.length} جهاز معتمد)
                        </span>
                    </h4>
                </div>

                {approvedDevices.length === 0 ? (
                    <div className="text-center py-7 text-xs text-gray-500 bg-zinc-800/20 rounded-2xl border border-white/5">
                        لم يتم اعتماد أي جهاز كاشير بعد. ستظهر طلبات الأجهزة اللوحية هنا تلقائياً عند فتح شاشة الكاشير في الفرع.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {approvedDevices.map(dev => (
                            <div
                                key={dev.id || dev.device_id}
                                className="bg-zinc-800/40 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-4 space-y-3 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Tablet size={16} className="text-emerald-400" />
                                            <span className="font-mono font-bold text-sm text-white tracking-wide">
                                                {dev.device_id}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-bold mt-1.5">
                                            الفرع: <span className="text-amber-400 font-black">{dev.branch_name}</span>
                                        </p>
                                        {dev.approved_at && (
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                معتمد منذ: {new Date(dev.approved_at).toLocaleDateString('ar-SA')}
                                            </p>
                                        )}
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        مصرح له 🟢
                                    </span>
                                </div>

                                <div className="pt-2.5 border-t border-white/5 flex justify-end">
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === dev.device_id}
                                        onClick={() => handleRevoke(dev.device_id)}
                                        className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition-colors font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        <Ban size={13} />
                                        <span>حظر / إلغاء الصلاحية</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Blocked Devices Section (if any) */}
            {blockedDevices.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                        <Ban size={16} />
                        <span>الأجهزة المحظورة من فتح الكاشير:</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {blockedDevices.map(dev => (
                            <div
                                key={dev.id || dev.device_id}
                                className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 flex items-center justify-between"
                            >
                                <div>
                                    <span className="font-mono text-xs font-bold text-red-400 line-through tracking-wider">
                                        {dev.device_id}
                                    </span>
                                    <p className="text-[11px] text-gray-500">فرع {dev.branch_name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleApprove(dev.device_id)}
                                    className="text-xs bg-zinc-800 hover:bg-emerald-600 hover:text-white text-gray-300 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                                >
                                    إعادة التفعيل
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal for manual pre-authorization */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-right"
                    >
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <h3 className="font-black text-white text-base flex items-center gap-2">
                                <Tablet size={18} className="text-primary" />
                                <span>اعتماد معرّف تابلت مسبقاً</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddManual} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 block">
                                    معرّف الجهاز (Device ID):
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثال: JT-POS-IC1XG"
                                    value={manualDeviceId}
                                    onChange={e => setManualDeviceId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-amber-400 uppercase tracking-wider outline-none focus:border-primary"
                                    autoFocus
                                />
                                <p className="text-[10px] text-gray-500">
                                    اكتب نفس الرمز الذي يظهر على شاشة تابلت الفرع باللون الأصفر.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 block">
                                    الفرع المخصص له هذا التابلت:
                                </label>
                                <select
                                    value={manualBranch}
                                    onChange={e => setManualBranch(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-primary cursor-pointer"
                                >
                                    <option value="السويدي الغربي">فرع السويدي الغربي</option>
                                    <option value="طويق">فرع طويق</option>
                                    <option value="الرئيسي">الفرع الرئيسي</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 block">
                                    ملاحظة / اسم الجهاز (اختياري):
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثال: تابلت المحاسب 1"
                                    value={manualDeviceName}
                                    onChange={e => setManualDeviceName(e.target.value)}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingManual}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSavingManual ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>تفعيل واعتماد فوراً 🚀</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
