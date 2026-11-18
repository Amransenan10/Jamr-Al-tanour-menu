import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { CashierPage } from './pages/CashierPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrders } from './pages/MyOrders';
import { AdminPage } from './pages/AdminPage';
import { SocialRedirect } from './pages/SocialRedirect';
import { AdTrackingRedirect } from './pages/AdTrackingRedirect';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { initSecurityGuard } from './utils/securityGuard';

// تفعيل نظام الحماية ومنع لوحة الأوامر وفحص الأكواد
initSecurityGuard();

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
          {/* روابط الحسابات المختصرة الرسمية لمواقع التواصل الاجتماعي */}
          <Route path="/t" element={<SocialRedirect platformKey="t" />} />
          <Route path="/tiktok" element={<SocialRedirect platformKey="tiktok" />} />
          <Route path="/s" element={<SocialRedirect platformKey="s" />} />
          <Route path="/snap" element={<SocialRedirect platformKey="snap" />} />
          <Route path="/snapchat" element={<SocialRedirect platformKey="snapchat" />} />
          <Route path="/i" element={<SocialRedirect platformKey="i" />} />
          <Route path="/ig" element={<SocialRedirect platformKey="ig" />} />
          <Route path="/insta" element={<SocialRedirect platformKey="insta" />} />
          <Route path="/instagram" element={<SocialRedirect platformKey="instagram" />} />
          <Route path="/w" element={<SocialRedirect platformKey="w" />} />
          <Route path="/wa" element={<SocialRedirect platformKey="wa" />} />
          <Route path="/whatsapp" element={<SocialRedirect platformKey="whatsapp" />} />
          <Route path="/x" element={<SocialRedirect platformKey="x" />} />
          <Route path="/twitter" element={<SocialRedirect platformKey="twitter" />} />
          <Route path="/g" element={<SocialRedirect platformKey="g" />} />
          <Route path="/maps" element={<SocialRedirect platformKey="maps" />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
