import React, { useState } from 'react';
import { X, Trash2, Minus, Plus, MapPin, Phone, User, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Branch, OrderType, Order } from '../types';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { saveOrderLocally } from '../utils/orderStorage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  storeStatus?: 'open' | 'busy' | 'closed';
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, branch, storeStatus = 'open' }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string; type: 'fixed' | 'percentage'; value: number} | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [formData, setFormData] = useState(() => {
    const savedName = localStorage.getItem('jamr_customer_name') || '';
    const savedPhone = localStorage.getItem('jamr_customer_phone') || '';
    const savedLocation = localStorage.getItem('jamr_customer_location') || '';
    return {
      name: savedName,
      phone: savedPhone,
      location: savedLocation,
      notes: '',
      pickupTime: ''
    };
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

  const deliveryFee = orderType === 'delivery' ? 5 : 0;
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'fixed') {
      discountAmount = appliedPromo.value;
    } else if (appliedPromo.type === 'percentage') {
      discountAmount = (totalPrice * appliedPromo.value) / 100;
    }
  }
  
  // Ensure final price doesn't go below 0
  const finalPrice = Math.max(0, totalPrice + deliveryFee - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoError('');
    setPromoSuccess('');
    
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCodeInput.trim().toUpperCase())
        .eq('is_active', true)
        .single();
        
      if (error || !data) {
        setPromoError('كود الخصم غير صحيح أو غير مفعل');
        return;
      }
      
      // Check expiry
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setPromoError('تم انتهاء صلاحية كود الخصم');
        return;
      }

      setAppliedPromo({
        code: data.code,
        type: data.discount_type as 'fixed' | 'percentage',
        value: data.discount_value
      });
      setPromoSuccess('تم تطبيق كود الخصم بنجاح!');
      setPromoCodeInput('');
      
    } catch (e) {
      setPromoError('حدث خطأ أثناء التحقق من كود الخصم');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoSuccess('');
    setPromoError('');
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
        total_price: finalPrice,
        items: cart,
        status: 'new',
        // Typecasting below to bypass strict type checking temporarily, assuming the 'orders' table supports these columns per our recent migration
        ...({
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          promo_code: appliedPromo?.code || null
        } as any)
      };

      const { data, error } = await supabase.from('orders').insert([order]).select('id, created_at, status').single();
      if (error) throw error;

      localStorage.setItem('jamr_customer_name', formData.name);
      localStorage.setItem('jamr_customer_phone', formData.phone);
      if (orderType === 'delivery' && formData.location) {
        localStorage.setItem('jamr_customer_location', formData.location);
      }

      localStorage.setItem('jamr_active_order', data.id);

      saveOrderLocally({
        id: data.id,
        created_at: data.created_at || new Date().toISOString(),
        total: finalPrice,
        status: data.status || 'new',
        items_count: cart.reduce((acc, item) => acc + item.quantity, 0)
      });

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
                
                {/* Promo Code Section */}
                {step === 'checkout' && (
                  <div className="space-y-2 border-b border-gray-100 dark:border-white/5 pb-4">
                    {!appliedPromo ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={e => setPromoCodeInput(e.target.value)}
                          placeholder="لديك كود خصم؟"
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border-none focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity"
                          disabled={!promoCodeInput.trim()}
                        >
                          تطبيق
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-500/10 p-3 rounded-xl border border-green-200 dark:border-green-500/20">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle2 size={16} />
                          <span className="text-sm font-bold">تم تطبيق كود ({appliedPromo.code})</span>
                        </div>
                        <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {promoError && <p className="text-xs text-red-500 font-bold">{promoError}</p>}
                    {promoSuccess && <p className="text-xs text-green-600 dark:text-green-400 font-bold">{promoSuccess}</p>}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-bold">المجموع الفرعي</span>
                    <span className="font-bold text-gray-900 dark:text-white">{totalPrice} ر.س</span>
                  </div>
                  
                  {deliveryFee > 0 && step === 'checkout' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold">رسوم التوصيل</span>
                      <span className="font-bold text-gray-900 dark:text-white">+{deliveryFee} ر.س</span>
                    </div>
                  )}

                  {discountAmount > 0 && step === 'checkout' && (
                    <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                      <span className="font-bold">خصم ({appliedPromo?.code})</span>
                      <span className="font-bold">-{discountAmount.toFixed(2)} ر.س</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className="text-gray-900 dark:text-white font-black">الإجمالي الكلي</span>
                    <span className="text-2xl font-black text-primary">{step === 'checkout' ? finalPrice.toFixed(2) : totalPrice} ر.س</span>
                  </div>
                </div>

                {storeStatus === 'busy' && (
                  <div className="text-orange-500 bg-orange-500/10 p-2.5 rounded-xl text-xs font-bold text-center">
                    ملاحظة: نواجه ضغطاً حالياً، قد يتأخر تحضير طلبك قليلاً
                  </div>
                )}

                {step === 'cart' ? (
                  <button
                    disabled={storeStatus === 'closed'}
                    onClick={() => setStep('checkout')}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50",
                      storeStatus === 'closed' ? "bg-red-500/50 text-white cursor-not-allowed" : "bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95"
                    )}
                  >
                    {storeStatus === 'closed' ? 'المطعم مغلق حالياً' : 'إتمام الطلب'}
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
                      disabled={loading || storeStatus === 'closed'}
                      onClick={handleSubmitOrder}
                      className={cn(
                        "flex-[2] py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50",
                        storeStatus === 'closed' ? "bg-red-500/50 text-white cursor-not-allowed" : "bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95"
                      )}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : storeStatus === 'closed' ? 'المطعم مغلق' : 'تأكيد الطلب'}
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
