
import React, { useState, useMemo, useRef } from 'react';
import { MenuItem, Review, OrderPayload, RestaurantConfig } from './types';
import { CATEGORIES } from './data';
import { CloseIcon } from './components/Icons';

interface DashboardProps {
  menuItems: MenuItem[];
  deleteMenuItem: (id: string) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItemPrice: (id: string, newPrice: number) => void;
  toggleItemVisibility: (id: string) => void; 
  restaurantConfig: RestaurantConfig;
  updateRestaurantConfig: (config: RestaurantConfig) => void;
  reviews: Review[];
  orders: OrderPayload[];
  onClose: () => void;
}

type TabOption = 'overview' | 'orders' | 'reviews' | 'admin';

const Dashboard: React.FC<DashboardProps> = ({ 
  menuItems, updateMenuItemPrice, toggleItemVisibility,
  restaurantConfig, updateRestaurantConfig,
  reviews, orders, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<TabOption>('overview');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1234') {
      setIsAdminAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const itemsWithStats = useMemo(() => {
    return menuItems.map(item => {
      const itemReviews = reviews.filter(r => r.itemId === item.id);
      const avg = itemReviews.length > 0 ? itemReviews.reduce((s, r) => s + r.rating, 0) / itemReviews.length : 0;
      return { ...item, avg, reviewCount: itemReviews.length };
    });
  }, [reviews, menuItems]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white shrink-0 font-bold">🛠️</div>
          <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>الإحصائيات</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>الطلبات ({orders.length})</button>
          <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reviews' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>التقييمات</button>
          <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>الإدارة 🔒</button>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
      </header>

      <div className="flex-grow overflow-y-auto p-4 sm:p-6">
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <span className="text-gray-400 text-sm block mb-1">إجمالي المبيعات</span>
                <span className="text-3xl font-bold text-green-600">{orders.reduce((sum, o) => sum + o.total, 0)} ر.س</span>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <span className="text-gray-400 text-sm block mb-1">عدد الطلبات</span>
                <span className="text-3xl font-bold text-gray-900">{orders.length}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                <span className="text-gray-400 text-sm block mb-1">حالة المتجر</span>
                <span className={`text-xl font-bold ${restaurantConfig.isOpen ? 'text-green-600' : 'text-red-600'}`}>{restaurantConfig.isOpen ? 'مفتوح' : 'مغلق'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-black">{order.customer.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${order.orderType === 'delivery' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {order.orderType === 'delivery' ? '🛵 توصيل' : '🏠 استلام'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleString('ar-SA')}</span>
                </div>
                <div className="space-y-2 text-sm border-t pt-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-black font-bold">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.totalPrice} ر.س</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-gray-900">بيانات العميل:</div>
                  <div className="text-black font-bold">📱 {order.customer.phone}</div>
                  <div className="text-black font-bold">📍 {order.customer.locationUrl || 'استلام من الفرع'}</div>
                  <div className="flex justify-between font-black text-orange-600 text-sm border-t mt-2 pt-2">
                    <span>الإجمالي:</span>
                    <span>{order.total} ر.س</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="max-w-md mx-auto">
            {!isAdminAuthenticated ? (
              <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 text-center">
                <h2 className="text-2xl font-bold">تسجيل دخول الإدارة</h2>
                <input 
                  type="password" 
                  placeholder="كلمة المرور" 
                  className={`w-full p-4 rounded-xl border-2 text-center text-black font-bold ${passwordError ? 'border-red-500' : 'border-gray-100'}`}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold">دخول</button>
              </form>
            ) : (
              <div className="bg-white p-6 rounded-3xl space-y-6">
                <h2 className="text-xl font-bold border-b pb-4">إعدادات المتجر</h2>
                <div className="flex gap-4">
                  <button onClick={() => updateRestaurantConfig({...restaurantConfig, isOpen: true})} className={`flex-1 py-3 rounded-xl font-bold ${restaurantConfig.isOpen ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>فتح المتجر</button>
                  <button onClick={() => updateRestaurantConfig({...restaurantConfig, isOpen: false})} className={`flex-1 py-3 rounded-xl font-bold ${!restaurantConfig.isOpen ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>إغلاق المتجر</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
