import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { supabaseLoyaltyAdmin } from '../lib/loyaltySupabase';
import { Branch, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
    Clock, CheckCircle2, Package, Loader2, Bell, RefreshCw,
    MapPin, ShoppingBag, Phone, Bike, Coffee, ChevronDown, LogOut, Copy, ExternalLink,
    Settings, Volume2, X, LayoutList, Sun, Moon
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

// Dark mode context helper
const dm = (dark: boolean, darkCls: string, lightCls: string) => dark ? darkCls : lightCls;

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
const OrderCard: React.FC<{ order: Order & { id: string; created_at: string; status: OrderStatus }; onStatusChange: (id: string, status: OrderStatus) => void; updating: boolean; isDark: boolean }> = ({
    order, onStatusChange, updating, isDark
}) => {
    const status = order.status as OrderStatus;
    const cfg = STATUS_CONFIG[status] || {
        label: status || 'غير معروف',
        color: 'text-gray-400',
        bg: 'bg-gray-500/10 border-gray-500/30',
        icon: <Package size={14} />
    };
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
                'rounded-[2rem] border overflow-hidden flex flex-col transition-all',
                isDark ? 'bg-zinc-900' : 'bg-white shadow-sm',
                status === 'new' && 'border-blue-500/50 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20',
                status === 'accepted' && (isDark ? 'border-purple-500/30' : 'border-purple-400/40'),
                status === 'preparing' && (isDark ? 'border-amber-500/30' : 'border-amber-400/40'),
                status === 'ready' && 'border-green-500/50 shadow-lg shadow-green-500/10 ring-1 ring-green-500/20',
                status === 'completed' && (isDark ? 'border-white/5 opacity-60' : 'border-gray-200 opacity-60'),
                status === 'cancelled' && (isDark ? 'border-red-500/20 opacity-50' : 'border-red-300/40 opacity-50'),
            )}
        >
            {/* Header */}
            <div className={cn("p-5 flex items-start justify-between gap-3 border-b", isDark ? 'border-white/5' : 'border-gray-100')}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn('flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', cfg.bg, cfg.color)}>
                            {cfg.icon} {cfg.label}
                        </span>
                        {status === 'new' && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                    </div>
                    <p className={cn("font-black text-lg", isDark ? 'text-white' : 'text-gray-900')}>{order.customer_name}</p>
                </div>
                <div className="text-left flex flex-col items-end">
                    {order.discount_amount && order.discount_amount > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-black mb-1 border border-green-500/20 shadow-sm">
                            <span>خصم</span>
                            {order.promo_code && <span className="font-mono tracking-widest">{order.promo_code}</span>}
                            <span>({order.discount_amount} ر.س)</span>
                        </div>
                    ) : null}
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
                            : isDark ? 'bg-zinc-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    )}>
                        {(order as any).order_type === 'delivery' ? <Bike size={12} /> : <Coffee size={12} />}
                        {(order as any).order_type === 'delivery' ? 'توصيل' : 'استلام'}
                    </span>
                    {order.phone && (
                        <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-sm font-black px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors shadow-sm" title="اتصال بالعميل">
                            <Phone size={14} className="animate-pulse" /> <span className="tracking-widest" dir="ltr">{order.phone}</span>
                        </a>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                    {Array.isArray((order as any).items) && (order as any).items.map((item: any, i: number) => (
                        <div key={i} className={cn("flex flex-col text-sm border-b pb-2 last:border-0 last:pb-0", isDark ? 'border-white/5' : 'border-gray-100')}>
                            <div className="flex justify-between items-start">
                                <span className={cn("font-bold", isDark ? 'text-white' : 'text-gray-900')}>
                                    <span className="text-primary ml-1">×{item?.quantity || 1}</span> {item?.name || 'صنف غير معروف'}
                                </span>
                                <span className="text-gray-500 text-xs">{item?.totalPrice || 0} ر.س</span>
                            </div>
                            
                            {/* Options and Additives */}
                            {(item?.options?.length > 0 || item?.removedIngredients?.length > 0 || item?.notes) && (
                                <div className="mt-1 flex flex-col gap-1.5 pr-6 items-start">
                                    {(item?.options?.length > 0 || item?.removedIngredients?.length > 0) && (
                                        <div className="flex flex-wrap gap-1">
                                            {item?.options?.map((o: any) => (
                                                <span key={`${o.groupId}-${o.itemId}`} className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", isDark ? 'bg-zinc-800 text-gray-300 border border-white/5' : 'bg-gray-100 text-gray-600')}>
                                                    {o.itemName}
                                                </span>
                                            ))}
                                            {item.removedIngredients?.map((ing: string) => (
                                                <span key={ing} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">
                                                    بدون {ing}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {item.notes && (
                                        <span className="text-[11px] bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-xl border border-yellow-500/30 font-bold whitespace-pre-wrap break-words max-w-full">
                                            📝 {item.notes}
                                        </span>
                                    )}
                                </div>
                            )}
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
                                            className={cn("flex items-center gap-2 px-3 py-2 rounded-xl transition-colors shrink-0 text-sm font-bold", isDark ? 'bg-zinc-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900')}
                                            title="نسخ موقع العميل"
                                        >
                                            <Copy size={16} />
                                            نسخ موقع العميل
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div className={cn("flex items-center gap-2 text-xs text-gray-500 p-3 rounded-xl", isDark ? 'bg-zinc-800/50' : 'bg-gray-50')}>
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
export type SoundType = 'standard' | 'bell' | 'digital' | 'police' | 'melodic' | 'urgent' | 'soft';

let globalAudioCtx: any = null;
const getAudioContext = () => {
    if (!globalAudioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) globalAudioCtx = new AudioCtx();
    }
    return globalAudioCtx;
};

export const playNotificationSound = (type: SoundType = 'standard') => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

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
        } else if (type === 'police') {
            playTone(800, 'square', 0.4);
            playTone(600, 'square', 0.4, ctx.currentTime + 0.4);
        } else if (type === 'melodic') {
            playTone(440, 'sine', 0.2);
            playTone(554, 'sine', 0.2, ctx.currentTime + 0.2);
            playTone(659, 'sine', 0.4, ctx.currentTime + 0.4);
        } else if (type === 'urgent') {
            playTone(1000, 'sawtooth', 0.1);
            playTone(1000, 'sawtooth', 0.1, ctx.currentTime + 0.2);
            playTone(1000, 'sawtooth', 0.1, ctx.currentTime + 0.4);
        } else if (type === 'soft') {
            playTone(523, 'sine', 1.0);
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
    const [isPersistentSound, setIsPersistentSound] = useState(false);
    const [useNotifications, setUseNotifications] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [showSettings, setShowSettings] = useState(false);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [isDark, setIsDark] = useState(() => localStorage.getItem('jamr_cashier_theme') !== 'light');
    
    const [storeSettings, setStoreSettings] = useState<any>({ status: 'open', is_delivery_active: true, is_pickup_active: true });
    const storeStatus = storeSettings.status;
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [showMenuManagement, setShowMenuManagement] = useState(false);
    const [menuProducts, setMenuProducts] = useState<any[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(false);

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('jamr_cashier_theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Fetch products when opening menu management
    useEffect(() => {
        if (showMenuManagement && menuProducts.length === 0) {
            setLoadingMenu(true);
            supabase.from('products').select('*').order('category_id').order('name_ar').then(({ data }) => {
                if (data) setMenuProducts(data);
                setLoadingMenu(false);
            });
        }
    }, [showMenuManagement]);

    const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        // Optimistic update
        setMenuProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: nextStatus } : p));
        const { error } = await supabaseAdmin.from('products').update({ is_available: nextStatus }).eq('id', productId);
        if (error) {
            toast.error('تعذر تحديث الصنف');
            setMenuProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: currentStatus } : p));
        }
    };

    const soundPrefRef = React.useRef<SoundType>(soundPref);
    useEffect(() => {
        soundPrefRef.current = soundPref;
    }, [soundPref]);

    // ── Load store status and subscribe ───────────────────────────────────────
    useEffect(() => {
        const fetchStatus = async () => {
            if (!branch) return;
            const { data } = await supabase.from('store_settings').select('*').eq('branch_name', branch).single();
            if (data) setStoreSettings(data);
        };
        fetchStatus();

        const statusChannel = supabase
            .channel('store-status-cashier')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, 
                (payload) => {
                    const newRow = payload.new as any;
                    if (newRow && newRow.branch_name === branch) {
                        setStoreSettings(newRow);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(statusChannel); };
    }, [branch]);

    const updateStoreSetting = async (field: string, value: any, successMsg: string) => {
        if (isUpdatingStatus || !branch) return;
        setIsUpdatingStatus(true);
        // Optimistic update
        setStoreSettings((prev: any) => ({ ...prev, [field]: value }));
        
        const { error } = await supabaseAdmin.from('store_settings').update({ [field]: value }).eq('branch_name', branch);
        if (error) {
            toast.error('تعذر التحديث');
        } else {
            toast.success(successMsg);
        }
        setIsUpdatingStatus(false);
    };

    const toggleStoreStatus = () => {
        const nextStatus = storeStatus === 'open' ? 'busy' : storeStatus === 'busy' ? 'prayer' : storeStatus === 'prayer' ? 'closed' : 'open';
        updateStoreSetting('status', nextStatus, `حالة المطعم: ${nextStatus === 'open' ? 'مفتوح' : nextStatus === 'busy' ? 'مزدحم' : nextStatus === 'prayer' ? 'مشغول (صلاة)' : 'مغلق'}`);
    };

    // ── Load saved branch and settings ─────────────────────────────────────────
    useEffect(() => {
        const savedBranch = localStorage.getItem('jamr_cashier_branch') as Branch;
        const savedAuth = localStorage.getItem('jamr_cashier_auth');
        if (savedBranch && savedAuth === 'true') {
            setBranch(savedBranch);
            setIsAuthenticated(true);
            // We intentionally leave isAudioUnlocked as false here so the overlay shows up 
            // and forces the user to click at least once when reloading the page.
        }
        const savedSound = localStorage.getItem('jamr_cashier_sound') as SoundType;
        if (savedSound) setSoundPref(savedSound);
        const savedPersistent = localStorage.getItem('jamr_cashier_persistent_sound') === 'true';
        setIsPersistentSound(savedPersistent);
        const savedNotifications = localStorage.getItem('jamr_cashier_use_notifications') === 'true';
        setUseNotifications(savedNotifications);
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        // Unlock audio on any interaction
        const unlockAudio = () => {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') ctx.resume();
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            setUseNotifications(true);
            localStorage.setItem('jamr_cashier_use_notifications', 'true');
            toast.success('تم تفعيل إشعارات النظام بنجاح');
        }
    };

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
                setIsAudioUnlocked(true); // User just clicked login, interact implicitly
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
                        
                        // System Notification
                        if (Notification.permission === 'granted' && localStorage.getItem('jamr_cashier_use_notifications') === 'true') {
                            new Notification('🔔 طلب جديد وصل!', {
                                body: `اسم العميل: ${payload.new.customer_name}\nالقيمة: ${payload.new.total_price} ر.س${payload.new.discount_amount ? `\nخصم: ${payload.new.discount_amount} ر.س` : ''}`,
                                icon: '/assets/logo.png',
                                tag: 'new-order',
                                requireInteraction: true
                            });
                        }

                        setTimeout(() => setNewOrderAlert(false), 8000);
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

        const order = orders.find(o => o.id === id);
        
        // Handle Loyalty Sync when order is successfully completed
        if (newStatus === 'completed' && order && order.status !== 'completed' && order.phone && supabaseLoyaltyAdmin) {
            const usedMatch = order.notes?.match(/\[LOYALTY_USED:(\d+)\]/);
            const earnedMatch = order.notes?.match(/\[LOYALTY_EARNED:(\d+)\]/);
            
            const usedPoints = usedMatch ? parseInt(usedMatch[1]) || 0 : 0;
            const earnedPoints = earnedMatch ? parseInt(earnedMatch[1]) || 0 : 0;
            const diff = earnedPoints - usedPoints;
            
            if (diff !== 0 || usedPoints > 0) {
                try {
                    const { data: customer } = await supabaseLoyaltyAdmin
                        .from('customers')
                        .select('points_balance')
                        .eq('phone_number', order.phone)
                        .single();
                        
                    if (customer) {
                        await supabaseLoyaltyAdmin
                            .from('customers')
                            .update({ points_balance: Math.max(0, customer.points_balance + diff) })
                            .eq('phone_number', order.phone);
                    } else if (diff > 0) {
                        await supabaseLoyaltyAdmin
                            .from('customers')
                            .insert([{
                                phone_number: order.phone,
                                full_name: order.customer_name || 'عميل المنيو',
                                points_balance: diff
                            }]);
                    }
                } catch (e) {
                    console.error('Failed to sync loyalty points:', e);
                }
            }
        }

        await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', id);
        setUpdatingId(null);
    };

    // ── Filter orders ─────────────────────────────────────────────────────────
    const ACTIVE_STATUSES: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready'];
    const filtered = orders.filter(o =>
        filter === 'active' ? ACTIVE_STATUSES.includes(o.status) : o.status === filter
    );

    const counts = {
        active: orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
        new: orders.filter(o => o.status === 'new').length,
    };

    // ── Looping Alert Sound ──────────────────────────────────────────────────
    useEffect(() => {
        let interval: any;
        if (counts.new > 0) {
            // Play immediately if wasn't already looping
            playNotificationSound(soundPrefRef.current);
            // Repeat every 4 seconds until the cashier accepts all new orders
            interval = setInterval(() => {
                playNotificationSound(soundPrefRef.current);
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [counts.new]);

    // ── Branch login screen ───────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-6", isDark ? 'bg-charcoal' : 'bg-gray-50')}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn("w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative", isDark ? 'bg-zinc-900 border border-white/5' : 'bg-white border border-gray-100')}
                >
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                    <div className="text-center space-y-8 relative">
                        <div>
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto mb-5 overflow-hidden p-2 border border-white/10">
                                <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
                            </div>
                            <h1 className={cn("text-3xl font-black", isDark ? 'text-white' : 'text-gray-900')}>لوحة الكاشير</h1>
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
                                        className={cn("group w-full flex items-center justify-between p-5 hover:bg-primary rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95", isDark ? 'bg-zinc-800' : 'bg-gray-100')}
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
                                        className={cn("w-full border-0 rounded-2xl p-4 text-center font-bold text-lg focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-500", isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900')}
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

    // ── Cashier Audio Unlock Overlay ──────────────────────────────────────────
    if (isAuthenticated && !isAudioUnlocked) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-6 cursor-pointer", isDark ? 'bg-charcoal' : 'bg-gray-50')} onClick={() => {
                const ctx = getAudioContext();
                if (ctx && ctx.state === 'suspended') ctx.resume();
                playNotificationSound('soft');
                setIsAudioUnlocked(true);
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center space-y-6 max-w-sm"
                >
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center animate-pulse shadow-2xl shadow-primary/50">
                        <Volume2 size={40} className="text-white" />
                    </div>
                    <h2 className={cn("text-3xl font-black leading-tight", isDark ? 'text-white' : 'text-gray-900')}>جاهز لاستقبال الطلبات؟</h2>
                    <p className="text-gray-400">إضغط في أي مكان على الشاشة لتفعيل الرنين الصوتي للطلبات الجديدة</p>
                    <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 mt-4 pointer-events-none">
                        بدء العمل وتفعيل الصوت
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Main cashier view ─────────────────────────────────────────────────────
    return (
        <div className={cn("min-h-screen transition-colors duration-300", isDark ? 'bg-charcoal text-white' : 'bg-gray-50 text-gray-900')}>
            {/* New order alert banner */}
            <AnimatePresence>
                {newOrderAlert && (
                    <motion.div
                        initial={{ y: -60 }}
                        animate={{ y: 0 }}
                        exit={{ y: -60 }}
                        className="fixed top-0 inset-x-0 z-50 bg-primary text-white text-center py-4 font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 px-6"
                    >
                        <div className="flex items-center gap-3">
                            <span className="animate-bounce">🔔</span>
                            <span>يوجد طلبات جديدة لم يتم قبولها!</span>
                        </div>
                        <button 
                            onClick={() => setNewOrderAlert(false)}
                            className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-colors border border-white/20"
                        >
                            إيقاف التنبيه
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className={cn("sticky top-0 z-40 backdrop-blur-md border-b px-4 py-4", isDark ? 'bg-charcoal/90 border-white/5' : 'bg-white/90 border-gray-200')}>
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden p-1 border border-white/10">
                            <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className={cn("font-black text-lg leading-none", isDark ? 'text-white' : 'text-gray-900')}>كاشير جمر التنور</h1>
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
                             storeStatus === 'busy' ? '🟠 مزدحم' : 
                             storeStatus === 'prayer' ? '🕌 مشغول (صلاة)' : '🔴 مغلق'}
                        </button>
                        <div className={cn("w-px h-6 mx-1", isDark ? 'bg-white/10' : 'bg-gray-200')}></div>
                        <button
                            onClick={() => updateStoreSetting('is_delivery_active', !storeSettings.is_delivery_active, storeSettings.is_delivery_active ? 'تم إيقاف التوصيل' : 'تم تفعيل التوصيل')}
                            disabled={isUpdatingStatus}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border shadow-sm",
                                storeSettings.is_delivery_active ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" : "bg-zinc-800 text-gray-500 border-white/5 opacity-70"
                            )}
                            title="التوصيل"
                        >
                            <Bike size={12} /> {storeSettings.is_delivery_active ? 'توصيل متاح' : 'توصيل مغلق'}
                        </button>
                        <button
                            onClick={() => updateStoreSetting('is_pickup_active', !storeSettings.is_pickup_active, storeSettings.is_pickup_active ? 'تم إيقاف الاستلام' : 'تم تفعيل الاستلام')}
                            disabled={isUpdatingStatus}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors border shadow-sm",
                                storeSettings.is_pickup_active ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" : "bg-zinc-800 text-gray-500 border-white/5 opacity-70"
                            )}
                            title="الاستلام من الفرع"
                        >
                            <Coffee size={12} /> {storeSettings.is_pickup_active ? 'استلام متاح' : 'استلام مغلق'}
                        </button>
                        <div className={cn("w-px h-6 mx-1", isDark ? 'bg-white/10' : 'bg-gray-200')}></div>
                        {counts.new > 0 && (
                            <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                                <Bell size={12} /> {counts.new} جديد
                            </span>
                        )}
                        <button
                            onClick={toggleTheme}
                            className={cn("p-2.5 rounded-xl transition-colors", isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200')}
                            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
                        >
                            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-600" />}
                        </button>
                        <button
                            onClick={fetchOrders}
                            className={cn("p-2.5 rounded-xl transition-colors", isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200')}
                            title="تحديث"
                        >
                            <RefreshCw size={16} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => setShowMenuManagement(true)}
                            className={cn("p-2.5 rounded-xl transition-colors", isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200')}
                            title="إدارة الأصناف"
                        >
                            <LayoutList size={16} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className={cn("p-2.5 rounded-xl transition-colors", isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200')}
                            title="الإعدادات"
                        >
                            <Settings size={16} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => { setBranch(null); localStorage.removeItem('jamr_cashier_branch'); setIsAuthenticated(false); localStorage.removeItem('jamr_cashier_auth'); }}
                            className={cn("p-2.5 rounded-xl transition-colors hover:bg-red-500/20 hover:text-red-400", isDark ? 'bg-zinc-800' : 'bg-gray-100')}
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
                    <div key={stat.label} className={cn("rounded-2xl p-3 text-center border", isDark ? 'bg-zinc-900 border-white/5' : 'bg-white border-gray-100 shadow-sm')}>
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
                                    : isDark ? 'bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 shadow-sm'
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
                        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4", isDark ? 'bg-zinc-900' : 'bg-gray-100')}>
                            <ShoppingBag size={36} className="text-gray-400" />
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
                                    isDark={isDark}
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
                            className={cn("rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl max-h-[90vh] flex flex-col", isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-gray-100')}
                        >
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className={cn("text-xl font-black flex items-center gap-2", isDark ? 'text-white' : 'text-gray-900')}>
                                    <Volume2 className="text-primary" />
                                    إعدادات الصوت
                                </h3>
                                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-6">
                                <div className="space-y-2">
                                    {[
                                        { id: 'standard', label: 'تنبيه قياسي' },
                                        { id: 'bell', label: 'جرس مطعم' },
                                        { id: 'digital', label: 'تنبيه رقمي' },
                                        { id: 'police', label: 'صافرة إنذار' },
                                        { id: 'melodic', label: 'نغمة هادئة' },
                                        { id: 'urgent', label: 'تنبيه عاجل' },
                                        { id: 'soft', label: 'نغمة ناعمة' }
                                    ].map(sound => (
                                        <button
                                            key={sound.id}
                                            onClick={() => {
                                                setSoundPref(sound.id as SoundType);
                                                localStorage.setItem('jamr_cashier_sound', sound.id);
                                                playNotificationSound(sound.id as SoundType);
                                            }}
                                            className={cn(
                                                "w-full flex justify-between items-center p-3.5 rounded-2xl font-bold transition-all",
                                                soundPref === sound.id
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : isDark ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            )}
                                        >
                                            <span className="text-sm">{sound.label}</span>
                                            {soundPref === sound.id && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>

                                <div className={cn("pt-6 border-t space-y-3", isDark ? 'border-white/5' : 'border-gray-100')}>
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 mr-1">حالة المتجر</h4>
                                    {[
                                        { id: 'open', label: '🟢 مفتوح', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                                        { id: 'busy', label: '🟠 مزدحم', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                                        { id: 'prayer', label: '🕌 مشغول (صلاة)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                                        { id: 'closed', label: '🔴 مغلق', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
                                    ].map(status => (
                                        <button
                                            key={status.id}
                                            disabled={isUpdatingStatus}
                                            onClick={() => updateStoreSetting('status', status.id, `تم التغيير إلى ${status.label}`)}
                                            className={cn(
                                                "w-full flex justify-between items-center p-3.5 rounded-2xl font-bold transition-all border",
                                                storeStatus === status.id ? status.color : isDark ? "bg-zinc-800 border-transparent text-gray-400" : "bg-gray-100 border-transparent text-gray-400"
                                            )}
                                        >
                                            <span className="text-sm">{status.label}</span>
                                            {storeStatus === status.id && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>

                                <div className={cn("pt-6 border-t space-y-3", isDark ? 'border-white/5' : 'border-gray-100')}>
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 mr-1">تنبيه الطلبات الجديدة</h4>
                                    <button
                                        onClick={() => {
                                            const newVal = !isPersistentSound;
                                            setIsPersistentSound(newVal);
                                            localStorage.setItem('jamr_cashier_persistent_sound', String(newVal));
                                            if (newVal) toast.success('تفعيل التنبيه المستمر');
                                        }}
                                        className={cn(
                                            "w-full flex justify-between items-center p-4 rounded-2xl font-bold transition-all border",
                                            isPersistentSound 
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                : isDark ? "bg-zinc-800 border-transparent text-gray-400 opacity-60" : "bg-gray-100 border-transparent text-gray-400 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-sm">
                                            <Bell size={18} className={cn(isPersistentSound && "animate-ring")} />
                                            <span>تنبيه مستمر حتى القبول</span>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors",
                                            isPersistentSound ? "bg-amber-500" : "bg-zinc-600"
                                        )}>
                                            <div className={cn(
                                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                isPersistentSound ? "right-6" : "right-1"
                                            )} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (notificationPermission !== 'granted') {
                                                requestNotificationPermission();
                                            } else {
                                                const newVal = !useNotifications;
                                                setUseNotifications(newVal);
                                                localStorage.setItem('jamr_cashier_use_notifications', String(newVal));
                                                toast.success(newVal ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات');
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex justify-between items-center p-4 rounded-2xl font-bold transition-all border",
                                            (useNotifications && notificationPermission === 'granted')
                                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                : isDark ? "bg-zinc-800 border-transparent text-gray-400 opacity-60" : "bg-gray-100 border-transparent text-gray-400 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-sm flex-1">
                                            <Bell size={18} className="shrink-0" />
                                            <span className="text-right">إشعارات النظام (على الشاشة)</span>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors shrink-0 mx-2",
                                            (useNotifications && notificationPermission === 'granted') ? "bg-blue-500" : "bg-zinc-600"
                                        )}>
                                            <div className={cn(
                                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                (useNotifications && notificationPermission === 'granted') ? "right-6" : "right-1"
                                            )} />
                                        </div>
                                    </button>
                                </div>

                                <p className="text-[10px] text-gray-500 mt-4 text-center leading-relaxed">
                                    سيتم تشغيل النغمة المختارة عند وصول طلب جديد. التنبيه المستمر يكرر الصوت كل 3 ثواني. إشعارات النظام تظهر حتى لو كان المتصفح مصغراً.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Menu Management Modal */}
            <AnimatePresence>
                {showMenuManagement && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMenuManagement(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={cn("rounded-3xl p-6 w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] flex flex-col", isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-gray-100')}
                        >
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className={cn("text-xl font-black flex items-center gap-2", isDark ? 'text-white' : 'text-gray-900')}>
                                    <LayoutList className="text-primary" />
                                    إدارة الأصناف (توفير / نفاذ المكونات)
                                </h3>
                                <button onClick={() => setShowMenuManagement(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
                                {loadingMenu ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {menuProducts.map(product => (
                                            <div key={product.id} className={cn("p-3 rounded-2xl flex items-center justify-between border", isDark ? 'bg-zinc-800 border-white/5' : 'bg-gray-50 border-gray-100')}>
                                                <div className="flex items-center gap-3">
                                                    {product.image_url && <img src={product.image_url} alt={product.name_ar} className="w-10 h-10 rounded-xl object-cover" />}
                                                    <div>
                                                        <p className={cn("font-bold text-sm", isDark ? 'text-white' : 'text-gray-900')}>{product.name_ar}</p>
                                                        <p className="text-xs text-primary">{product.price} ر.س</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleProductAvailability(product.id, product.is_available)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border shadow-sm",
                                                        product.is_available ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                    )}
                                                >
                                                    {product.is_available ? 'متاح' : 'غير متاح'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
