import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Order } from '../types';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Clock, MapPin, ChefHat, Bike, Receipt } from 'lucide-react';
import { updateStoredOrderStatus } from '../utils/orderStorage';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { id: 'new', label: 'تم الاستلام', icon: Clock, description: 'نراجع طلبك الآن' },
  { id: 'accepted', label: 'مقبول', icon: CheckCircle2, description: 'تم تأكيد طلبك' },
  { id: 'preparing', label: 'قيد التجهيز', icon: ChefHat, description: 'وجبتك تُحضر في المطبخ' },
  { id: 'ready', label: 'جاهز للاستلام', icon: Bike, description: 'اطلبك جاهز!' },
  { id: 'completed', label: 'مكتمل', icon: Receipt, description: 'تم تسليم الطلب' },
];

export const OrderTracking: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request notification permission if not granted yet
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order', err);
        toast.error('لم نتمكن من العثور على الطلب');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to realtime updates for this specific order
    const subscription = supabase
      .channel(`order_tracking_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrder(updatedOrder);
          
          // Update local storage status
          if (updatedOrder.id) {
            updateStoredOrderStatus(updatedOrder.id, updatedOrder.status);
          }

          // Show notifications
          const stepMsg = STATUS_STEPS.find(s => s.id === updatedOrder.status)?.label || 'تحديث جديد';
          toast.success(`تحديث في الطلب: ${stepMsg}`, {
            duration: 5000,
            icon: '🔔',
          });
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('تحديث في طلب الجمر التنور', {
              body: `حالة طلبك الآن: ${stepMsg}`,
              icon: '/vite.svg'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled';

  // For delivery orders we might change the "ready" label slightly
  const displaySteps = STATUS_STEPS.map(step => {
    if (order.order_type === 'delivery' && step.id === 'ready') {
      return { ...step, label: 'في الطريق', description: 'المندوب في طريقه إليك' };
    }
    return step;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 sticky top-0 z-10 px-4 py-4 mb-6 shadow-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowRight size={20} />
          <span className="font-bold">العودة للقائمة</span>
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">تتبع الطلب</h1>
          <p className="text-gray-500 text-sm">رقم الطلب: #{order.id?.slice(0, 8).toUpperCase()}</p>
        </div>

        {isCancelled ? (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-6 rounded-3xl text-center text-red-600 dark:text-red-400">
            <h2 className="text-xl font-bold mb-2">تم إلغاء الطلب</h2>
            <p className="text-sm">يرجى التواصل معنا إذا كان لديك أي استفسار.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
            {/* Progress indicators */}
            <div className="space-y-8 relative before:absolute before:inset-0 before:mr-[21px] before:w-0.5 before:bg-gray-100 dark:before:bg-white/5 before:h-full before:-z-0">
              {displaySteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative z-10 flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 transition-colors duration-500
                        ${isCompleted 
                          ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' 
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}
                    >
                      <Icon size={20} />
                    </motion.div>
                    
                    <div className="pt-2">
                      <h4 className={`font-bold transition-colors duration-500 ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {step.label}
                      </h4>
                      <p className={`text-sm mt-0.5 transition-colors duration-500 ${isCurrent ? 'text-primary font-medium' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">تفاصيل الطلب</h3>
          
          <div className="space-y-3 mt-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{item.quantity}x</span>
                    <span className="text-gray-900 dark:text-gray-300 font-medium">{item.name}</span>
                  </div>
                  {item.options?.length > 0 && (
                     <div className="text-xs text-gray-500 mr-9 mt-1">
                       {item.options.map(o => o.itemName).join(', ')}
                     </div>
                  )}
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.totalPrice} ر.س</span>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
             <span className="font-bold text-gray-500">الإجمالي الكلي</span>
             <span className="font-black text-xl text-primary">{Math.max(0, order.total_price)} ر.س</span>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
             <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  {order.order_type === 'delivery' ? <MapPin size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div>
                  <p className="font-bold">{order.order_type === 'delivery' ? 'عنوان التوصيل' : 'تفضيل الطلب'}</p>
                  <p>{order.order_type === 'delivery' ? (order.location || 'لم يتم تحديده') : 'استلام من الفرع'}</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
