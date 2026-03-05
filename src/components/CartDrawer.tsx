import React, { useState } from 'react';
import { X, Trash2, Minus, Plus, MapPin, Phone, User, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Branch, OrderType, Order } from '../types';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, branch }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    notes: '',
    pickupTime: ''
  });

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({
          ...prev,
          location: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
        }));
      }, (err) => {
        alert('تعذر تحديد الموقع تلقائياً، يرجى تفعيل إعدادات الموقع أو إدخاله يدوياً');
      });
    } else {
      alert('المتصفح الخاص بك لا يدعم تحديد الموقع');
    }
  };

  const handleSubmitOrder = async () => {
    if (!formData.name || !formData.phone || (orderType === 'delivery' && !formData.location)) {
      alert('يرجى إكمال جميع البيانات المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const order: Order = {
        branch,
        order_type: orderType,
        customer_name: formData.name,
        phone: formData.phone,
        location: orderType === 'delivery' ? formData.location : undefined,
        notes: formData.notes,
        total_price: totalPrice,
        items: cart,
        status: 'new'
      };

      const { data, error } = await supabase.from('orders').insert([order]).select('id').single();
      if (error) throw error;

      localStorage.setItem('jamr_active_order', data.id);
      clearCart();
      onClose();
      navigate(`/track/${data.id}`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">سلة الطلبات</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              {step === 'cart' && (
                <div className="space-y-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <ShoppingBag size={40} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">السلة فارغة</h3>
                      <p className="text-gray-500 text-sm">أضف بعض الوجبات اللذيذة لتبدأ طلبك</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</h4>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {item.options.map(o => (
                              <div key={o.itemId}>• {o.itemName}</div>
                            ))}
                            {item.removedIngredients.map(i => (
                              <div key={i} className="text-red-400">× بدون {i}</div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center bg-white dark:bg-zinc-800 rounded-xl p-0.5 border border-gray-100 dark:border-white/10">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-400 hover:text-primary"><Minus size={14} /></button>
                              <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-400 hover:text-primary"><Plus size={14} /></button>
                            </div>
                            <span className="font-black text-primary">{item.totalPrice} ر.س</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {step === 'checkout' && (
                <div className="space-y-8">
                  <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                    <button
                      onClick={() => setOrderType('pickup')}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        orderType === 'pickup' ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-gray-500"
                      )}
                    >
                      <Clock size={16} />
                      استلام
                    </button>
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        orderType === 'delivery' ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-gray-500"
                      )}
                    >
                      <MapPin size={16} />
                      توصيل
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 mr-2">الاسم بالكامل</label>
                      <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="أدخل اسمك"
                          className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 mr-2">رقم الجوال</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="05xxxxxxxx"
                          className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                        />
                      </div>
                    </div>

                    {orderType === 'delivery' ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center mr-2 ml-2">
                          <label className="text-xs font-bold text-gray-400">عنوان التوصيل</label>
                          <button
                            type="button"
                            onClick={handleLocationClick}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            <MapPin size={14} />
                            تحديد موقعي التلقائي
                          </button>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={formData.location}
                            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="الحي، الشارع، رقم المبنى (أو استخدم التحديد التلقائي)"
                            className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 mr-2">وقت الاستلام</label>
                        <div className="relative">
                          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="time"
                            value={formData.pickupTime}
                            onChange={e => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
                            className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 mr-2">ملاحظات إضافية</label>
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="أي طلبات خاصة؟"
                        className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">الإجمالي</span>
                  <span className="text-2xl font-black text-primary">{totalPrice} ر.س</span>
                </div>

                {step === 'cart' ? (
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    إتمام الطلب
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('cart')}
                      className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-2xl font-bold"
                    >
                      رجوع
                    </button>
                    <button
                      disabled={loading}
                      onClick={handleSubmitOrder}
                      className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الطلب'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import { ShoppingBag } from 'lucide-react';
