import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { CashierPage } from './pages/CashierPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrders } from './pages/MyOrders';
import { AdminPage } from './pages/AdminPage';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { initSecurityGuard } from './utils/securityGuard';
import { initLiveUpdateService } from './utils/liveUpdateService';

// تفعيل نظام الحماية ومنع لوحة الأوامر وفحص الأكواد
initSecurityGuard();

// تفعيل نظام التحديث اللحظي الفوري لجميع أجهزة العملاء والكاشير
initLiveUpdateService();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/cashier" element={<CashierPage />} />
          <Route path="/track/:id" element={<OrderTrackingPage />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/seo" element={<AdminPage seoOnly />} />

          {/* روابط المنيو المباشرة عبر المنصات الإعلانية ومواقع التواصل - تفتح المنيو فوراً */}
          <Route path="/t" element={<App />} />
          <Route path="/tiktok" element={<App />} />
          <Route path="/s" element={<App />} />
          <Route path="/snap" element={<App />} />
          <Route path="/snapchat" element={<App />} />
          <Route path="/i" element={<App />} />
          <Route path="/ig" element={<App />} />
          <Route path="/insta" element={<App />} />
          <Route path="/instagram" element={<App />} />
          <Route path="/w" element={<App />} />
          <Route path="/wa" element={<App />} />
          <Route path="/whatsapp" element={<App />} />
          <Route path="/x" element={<App />} />
          <Route path="/twitter" element={<App />} />
          <Route path="/g" element={<App />} />
          <Route path="/maps" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
