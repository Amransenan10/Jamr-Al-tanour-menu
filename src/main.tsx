import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { CashierPage } from './pages/CashierPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrders } from './pages/MyOrders';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/track/:id" element={<OrderTrackingPage />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
