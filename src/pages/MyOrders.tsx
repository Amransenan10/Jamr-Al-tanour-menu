import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Clock, ChevronLeft } from 'lucide-react';
import { getStoredOrders, StoredOrder } from '../utils/orderStorage';
import { motion } from 'motion/react';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    // Load local history
    setOrders(getStoredOrders() || []);
  }, []);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'new': return 'جديد';
      case 'accepted': return 'مقبول';
      case 'preparing': return 'قيد التجهيز';
      case 'ready': return 'جاهز / في الطريق';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 sticky top-0 z-10 px-4 py-4 mb-6 shadow-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowRight size={20} />
          <span className="font-bold">العودة للقائمة</span>
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">طلباتي السابقة</h1>
          <p className="text-gray-500 text-sm">سجل متابعة طلباتك المحفوظة في مساحتك المحلية.</p>
        </div>

        {orders.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/5">
             <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
               <ShoppingBag size={40} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا يوجد طلبات سابقة</h3>
             <p className="text-gray-500 text-sm mb-6">يبدو أنك لم تقم بأي طلب حتى الآن من هذا المتصفح.</p>
             <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform">
               تصفح المنيو
             </Link>
           </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
               const date = new Date(order.created_at);
               return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={order.id}
                >
                  <Link 
                    to={`/track/${order.id}`}
                    className="block bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusColor(order.status)}`}>
                           {getStatusLabel(order.status)}
                         </span>
                         <h3 className="font-bold text-gray-900 dark:text-white mt-3">طلب #{order.id.slice(0, 8).toUpperCase()}</h3>
                       </div>
                       <div className="text-left text-sm text-gray-500">
                         <div className="flex items-center gap-1.5 justify-end">
                           <Clock size={14} />
                           {date.toLocaleDateString('ar-SA')}
                         </div>
                         <div className="mt-1">{date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5">
                       <span className="text-gray-500 font-medium text-sm">{order.items_count} أصناف</span>
                       <div className="flex items-center gap-3">
                         <span className="font-black text-gray-900 dark:text-white">{order.total} ر.س</span>
                         <ChevronLeft size={18} className="text-gray-400" />
                       </div>
                    </div>
                  </Link>
                </motion.div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
