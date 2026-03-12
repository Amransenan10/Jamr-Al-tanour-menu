import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Branch, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
    Clock, CheckCircle2, Package, Loader2, Bell, RefreshCw,
    MapPin, ShoppingBag, Phone, User, Bike, Coffee, ChevronDown, LogOut, Copy, ExternalLink,
    Settings, Volume2, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────
type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface StatusConfig {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    new: { label: 'جديد', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: <Bell size={14} /> },
    accepted: { label: 'مقبول', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', icon: <CheckCircle2 size={14} /> },
    preparing: { label: 'قيد التحضير', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <Clock size={14} /> },
    ready: { label: 'جاهز', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: <Package size={14} /> },
    completed: { label: 'مكتمل', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', icon: <CheckCircle2 size={14} /> },
    cancelled: { label: 'ملغي', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <LogOut size={14} /> },
};

// Next status transitions for the cashier workflow
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    new: 'accepted',
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'completed',
};
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
    new: 'قبول الطلب',
    accepted: 'بدء التحضير',
    preparing: 'تحديد كجاهز',
    ready: 'إتمام الطلب',
};

// ─── OrderCard ──────────────────────────────────────────────────────────────
const OrderCard: React.FC<{ order: Order & { id: string; created_at: string; status: OrderStatus }; onStatusChange: (id: string, status: OrderStatus) => void; updating: boolean }> = ({
    order, onStatusChange, updating
}) => {
    const status = order.status as OrderStatus;
    const cfg = STATUS_CONFIG[status];
    const next = NEXT_STATUS[status];
    const nextLabel = NEXT_LABEL[status];

    const timeAgo = (() => {
        const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);
        if (diff < 60) return `${diff}ث`;
        if (diff < 3600) return `${Math.floor(diff / 60)}د`;
        return `${Math.floor(diff / 3600)}س`;
    })();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                'bg-zinc-900 rounded-[2rem] border overflow-hidden flex flex-col transition-all',
                status === 'new' && 'border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20',
                status === 'accepted' && 'border-purple-500/30',
                status === 'preparing' && 'border-amber-500/30',
                status === 'ready' && 'border-green-500/50 shadow-lg shadow-green-500/10 ring-1 ring-green-500/20',
                status === 'completed' && 'border-white/5 opacity-60',
                status === 'cancelled' && 'border-red-500/20 opacity-50',
            )}
        >
            {/* Header */}
            <div className="p-5 flex items-start justify-between gap-3 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn('flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', cfg.bg, cfg.color)}>
                            {cfg.icon} {cfg.label}
                        </span>
                        {status === 'new' && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                    </div>
                    <p className="text-white font-black text-lg">{order.customer_name}</p>
                </div>
                <div className="text-left">
                    <p className="text-primary font-black text-xl">{(order as any).total_price} ر.س</p>
                    <p className="text-gray-500 text-xs mt-0.5">منذ {timeAgo}</p>
                </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                    <span className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold',
                        (order as any).order_type === 'delivery'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-zinc-800 text-gray-400'
                    )}>
                        {(order as any).order_type === 'delivery' ? <Bike size={12} /> : <Coffee size={12} />}
                        {(order as any).order_type === 'delivery' ? 'توصيل' : 'استلام'}
                    </span>
                    {order.phone && (
                        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-zinc-800 text-gray-400">
                            <Phone size={12} /> {order.phone}
                        </span>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                    {Array.isArray((order as any).items) && (order as any).items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-start text-sm">
                            <span className="text-white font-bold">
                                <span className="text-primary ml-1">×{item.quantity}</span> {item.name}
                            </span>
                            <span className="text-gray-500 text-xs">{item.totalPrice} ر.س</span>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-amber-400 text-xs font-bold">ملاحظة: {order.notes}</p>
                    </div>
                )}

                {/* Location */}
                {(order as any).location && (
                    <div className="flex flex-col gap-2 mt-2">
                        {(() => {
                            const locStr = String((order as any).location);
                            let mapUrl = '';

                            if (locStr.includes('google.com/maps')) {
                                mapUrl = locStr;
                            } else if (locStr.startsWith('Lat:')) {
                                // Extract old format "Lat: 24.123, Lng: 46.123"
                                const match = locStr.match(/Lat:\s*([.\d]+),\s*Lng:\s*([.\d]+)/);
                                if (match) {
                                    mapUrl = `https://www.google.com/maps?q=${match[1]},${match[2]}`;
                                }
                            }

                            if (mapUrl) {
                                return (
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl py-2 hover:bg-blue-500/20 transition-colors"
                                        >
                                            <MapPin size={16} />
                                            فتح في الخرائط
                                            <ExternalLink size={14} className="opacity-50" />
                                        </a>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(mapUrl);
                                                toast.success('تم نسخ موقع العميل', { position: 'top-center' });
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-gray-400 hover:text-white rounded-xl transition-colors shrink-0 tooltip text-sm font-bold"
                                            title="نسخ موقع العميل"
                                        >
                                            <Copy size={16} />
                                            نسخ موقع العميل
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-zinc-800/50 p-3 rounded-xl">
                                    <MapPin size={14} className="text-primary shrink-0" />
                                    <span className="flex-1 break-words">{locStr}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(locStr);
                                            toast.success('تم نسخ العنوان', { position: 'top-center' });
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                        title="نسخ العنوان"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Actions */}
            {next && (
                <div className="p-4 pt-0 flex gap-2">
                    <button
                        disabled={updating}
                        onClick={() => onStatusChange((order as any).id, next)}
                        className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
                    >
                        {updating ? <Loader2 size={16} className="animate-spin" /> : nextLabel}
                    </button>
                    {status === 'new' && (
                        <button
                            disabled={updating}
                            onClick={() => onStatusChange((order as any).id, 'cancelled')}
                            className="px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm font-bold hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                            إلغاء
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

// ─── Audio Notification ──────────────────────────────────────────────────────
export type SoundType = 'standard' | 'bell' | 'digital';
export const playNotificationSound = (type: SoundType = 'standard') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const playTone = (freq: number, oscType: OscillatorType, duration: number, startTime = ctx.currentTime) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = oscType;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.frequency.setValueAtTime(freq, startTime);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        if (type === 'standard') {
            playTone(800, 'sine', 0.5);
        } else if (type === 'bell') {
            playTone(1200, 'sine', 0.8);
            playTone(1800, 'sine', 0.6, ctx.currentTime + 0.1);
        } else if (type === 'digital') {
            playTone(600, 'square', 0.15);
            playTone(800, 'square', 0.15, ctx.currentTime + 0.15);
            playTone(1000, 'square', 0.2, ctx.currentTime + 0.3);
        }
    } catch (e) {
        console.error('Audio play failed', e);
    }
};

// ─── CashierPage ─────────────────────────────────────────────────────────────
const BRANCHES: Branch[] = ['السويدي الغربي', 'طويق'];
const FILTER_STATUSES: (OrderStatus | 'active')[] = ['active', 'new', 'accepted', 'preparing', 'ready', 'completed'];
const FILTER_LABELS: Record<string, string> = {
    active: 'النشطة', new: 'جديدة', accepted: 'مقبولة',
    preparing: 'تحضير', ready: 'جاهزة', completed: 'مكتملة'
};

export const CashierPage: React.FC = () => {
    const [branch, setBranch] = useState<Branch | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginBranch, setLoginBranch] = useState<Branch | null>(null);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<OrderStatus | 'active'>('active');
    const [newOrderAlert, setNewOrderAlert] = useState(false);

    const [soundPref, setSoundPref] = useState<SoundType>('standard');
    const [showSettings, setShowSettings] = useState(false);
    
    const [storeStatus, setStoreStatus] = useState<'open' | 'busy' | 'closed'>('open');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const soundPrefRef = React.useRef<SoundType>(soundPref);
    useEffect(() => {
        soundPrefRef.current = soundPref;
    }, [soundPref]);

    // ── Load store status and subscribe ───────────────────────────────────────
    useEffect(() => {
        const fetchStatus = async () => {
            const { data } = await supabase.from('store_settings').select('status').single();
            if (data) setStoreStatus(data.status);
        };
        fetchStatus();

        const statusChannel = supabase
            .channel('store-status-cashier')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, 
                (payload) => {
                    const newRow = payload.new as any;
                    if (newRow && newRow.status) {
                        setStoreStatus(newRow.status);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(statusChannel); };
    }, []);

    const toggleStoreStatus = async () => {
        if (isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        const nextStatus = storeStatus === 'open' ? 'busy' : storeStatus === 'busy' ? 'closed' : 'open';
        
        const prevStatus = storeStatus;
        setStoreStatus(nextStatus);
        
        const { error } = await supabase.from('store_settings').update({ status: nextStatus }).eq('id', 1);
        if (error) {
            setStoreStatus(prevStatus);
            toast.error('تعذر تحديث حالة المطعم');
        } else {
            toast.success(`حالة المطعم: ${nextStatus === 'open' ? 'مفتوح' : nextStatus === 'busy' ? 'مزدحم' : 'مغلق'}`);
        }
        setIsUpdatingStatus(false);
    };

    // ── Load saved branch and settings ─────────────────────────────────────────
    useEffect(() => {
        const savedBranch = localStorage.getItem('jamr_cashier_branch') as Branch;
        const savedAuth = localStorage.getItem('jamr_cashier_auth');
        if (savedBranch && savedAuth === 'true') {
            setBranch(savedBranch);
            setIsAuthenticated(true);
        }
        const savedSound = localStorage.getItem('jamr_cashier_sound') as SoundType;
        if (savedSound) setSoundPref(savedSound);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginBranch || !password) return;
        setIsLoggingIn(true);
        setLoginError('');

        try {
            const { data, error } = await supabase
                .from('branch_credentials')
                .select('password')
                .eq('branch_name', loginBranch)
                .single();

            if (error || !data || data.password !== password) {
                setLoginError('كلمة المرور غير صحيحة');
                setPassword('');
            } else {
                setBranch(loginBranch);
                setIsAuthenticated(true);
                localStorage.setItem('jamr_cashier_branch', loginBranch);
                localStorage.setItem('jamr_cashier_auth', 'true');
            }
        } catch (err) {
            setLoginError('حدث خطأ في الاتصال');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // ── Fetch orders ──────────────────────────────────────────────────────────
    const fetchOrders = useCallback(async () => {
        if (!branch || !isAuthenticated) return;
        setLoading(true);
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('branch', branch)
            .order('created_at', { ascending: false });
        if (data) setOrders(data);
        setLoading(false);
    }, [branch]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ── Realtime subscription ─────────────────────────────────────────────────
    useEffect(() => {
        if (!branch) return;

        const channel = supabase
            .channel('cashier-orders')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `branch=eq.${branch}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setOrders(prev => [payload.new, ...prev]);
                        setNewOrderAlert(true);
                        playNotificationSound(soundPrefRef.current);
                        setTimeout(() => setNewOrderAlert(false), 4000);
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                    } else if (payload.eventType === 'DELETE') {
                        setOrders(prev => prev.filter(o => o.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [branch]);

    // ── Update status ─────────────────────────────────────────────────────────
    const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
        setUpdatingId(id);
        await supabase.from('orders').update({ status: newStatus }).eq('id', id);
        setUpdatingId(null);
    };

    // ── Filter orders ─────────────────────────────────────────────────────────
    const ACTIVE_STATUSES: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready'];
    const filtered = orders.filter(o =>
        filter === 'active' ? ACTIVE_STATUSES.includes(o.status) : o.status === filter
    );

    // ── Branch login screen ───────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-md bg-zinc-900 rounded-[3rem] p-10 shadow-2xl border border-white/5 relative"
                >
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                    <div className="text-center space-y-8 relative">
                        <div>
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto mb-5 overflow-hidden p-2 border border-white/10">
                                <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl font-black text-white">لوحة الكاشير</h1>
                            <p className="text-gray-500 mt-2 text-sm">
                                {loginBranch ? `تسجيل الدخول لفرع ${loginBranch}` : 'اختر الفرع لبدء استقبال الطلبات'}
                            </p>
                        </div>

                        {!loginBranch ? (
                            <div className="space-y-3">
                                {BRANCHES.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setLoginBranch(b)}
                                        className="group w-full flex items-center justify-between p-5 bg-zinc-800 hover:bg-primary rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin size={20} className="text-primary group-hover:text-white" />
                                            <span className="text-white font-black text-lg group-hover:text-white">فرع {b}</span>
                                        </div>
                                        <ChevronDown size={18} className="text-gray-500 group-hover:text-white -rotate-90" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1">
                                    <input
                                        type="password"
                                        placeholder="أدخل الرمز السري للفرع"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        className="w-full bg-zinc-800 text-white border-0 rounded-2xl p-4 text-center font-bold text-lg focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-500"
                                    />
                                    {loginError && (
                                        <p className="text-red-400 text-sm font-bold text-center mt-2">{loginError}</p>
                                    )}
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={!password || isLoggingIn}
                                    className="w-full bg-primary text-white font-black p-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : 'دخول'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginBranch(null);
                                        setPassword('');
                                        setLoginError('');
                                    }}
                                    className="w-full text-gray-500 text-sm font-bold hover:text-white transition-colors"
                                >
                                    العودة لاختيار الفرع
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main cashier view ─────────────────────────────────────────────────────
    const counts = {
        active: orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
        new: orders.filter(o => o.status === 'new').length,
    };

    return (
        <div className="min-h-screen bg-charcoal text-white">
            {/* New order alert banner */}
            <AnimatePresence>
                {newOrderAlert && (
                    <motion.div
                        initial={{ y: -60 }}
                        animate={{ y: 0 }}
                        exit={{ y: -60 }}
                        className="fixed top-0 inset-x-0 z-50 bg-primary text-white text-center py-3 font-black text-lg shadow-2xl shadow-primary/30"
                    >
                        🔔 طلب جديد وصل!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-charcoal/90 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden p-1 border border-white/10">
                            <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-black text-white text-lg leading-none">كاشير جمر التنور</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <MapPin size={11} className="text-primary" />
                                <span className="text-xs text-gray-400">فرع {branch}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleStoreStatus}
                            disabled={isUpdatingStatus}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border shadow-sm",
                                storeStatus === 'open' ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" :
                                storeStatus === 'busy' ? "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20" :
                                "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                            )}
                            title="تغيير حالة المطعم"
                        >
                            {isUpdatingStatus ? <Loader2 size={12} className="animate-spin" /> : 
                             storeStatus === 'open' ? '🟢 مفتوح' : 
                             storeStatus === 'busy' ? '🟠 مزدحم' : '🔴 مغلق'}
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        {counts.new > 0 && (
                            <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                                <Bell size={12} /> {counts.new} جديد
                            </span>
                        )}
                        <button
                            onClick={fetchOrders}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                            title="تحديث"
                        >
                            <RefreshCw size={16} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                            title="الإعدادات"
                        >
                            <Settings size={16} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => { setBranch(null); localStorage.removeItem('jamr_cashier_branch'); setIsAuthenticated(false); localStorage.removeItem('jamr_cashier_auth'); }}
                            className="p-2.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-4 gap-3">
                {[
                    { label: 'الكل', value: orders.length, color: 'text-gray-300' },
                    { label: 'نشطة', value: counts.active, color: 'text-primary' },
                    { label: 'تحضير', value: orders.filter(o => o.status === 'preparing').length, color: 'text-amber-400' },
                    { label: 'جاهزة', value: orders.filter(o => o.status === 'ready').length, color: 'text-green-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-zinc-900 rounded-2xl p-3 text-center border border-white/5">
                        <p className={cn('font-black text-2xl', stat.color)}>{stat.value}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="max-w-7xl mx-auto px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {FILTER_STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                'whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-bold transition-all',
                                filter === s
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-white/5'
                            )}
                        >
                            {FILTER_LABELS[s]}
                            {s === 'new' && counts.new > 0
                                ? ` (${counts.new})` : s === 'active' && counts.active > 0
                                    ? ` (${counts.active})` : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders grid */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 size={48} className="text-primary animate-spin" />
                        <p className="text-gray-500">جاري تحميل الطلبات...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag size={36} className="text-gray-700" />
                        </div>
                        <p className="text-gray-500 font-bold text-lg">لا توجد طلبات</p>
                        <p className="text-gray-600 text-sm mt-1">ستظهر الطلبات هنا تلقائياً عند وصولها</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onStatusChange={handleStatusChange}
                                    updating={updatingId === order.id}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm relative z-10 border border-white/10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <Volume2 className="text-primary" />
                                    إعدادات الصوت
                                </h3>
                                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { id: 'standard', label: 'جرس تنبيه عادي' },
                                    { id: 'bell', label: 'رنين مطعم' },
                                    { id: 'digital', label: 'تنبيه رقمي' }
                                ].map(sound => (
                                    <button
                                        key={sound.id}
                                        onClick={() => {
                                            setSoundPref(sound.id as SoundType);
                                            localStorage.setItem('jamr_cashier_sound', sound.id);
                                            playNotificationSound(sound.id as SoundType); // test the sound
                                        }}
                                        className={cn(
                                            "w-full flex justify-between items-center p-4 rounded-2xl font-bold transition-all",
                                            soundPref === sound.id
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                                        )}
                                    >
                                        <span>{sound.label}</span>
                                        {soundPref === sound.id && <CheckCircle2 size={18} />}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                سيتم تشغيل النغمة المختارة عند وصول طلب جديد
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
