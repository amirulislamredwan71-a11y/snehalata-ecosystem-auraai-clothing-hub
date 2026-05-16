import React from 'react';
import { HashRouter as Router, Routes, Route, Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { VendorOnboarding } from './pages/VendorOnboarding';
import { OrderTracking } from './pages/OrderTracking';
import { Footer } from './components/Footer';
import { VendorDashboard } from './pages/VendorDashboard';
import { StoreProfile } from './pages/StoreProfile';
import { VirtualTryOn } from './pages/VirtualTryOn';
import { Cart } from './pages/Cart';
import { CEODashboard } from './pages/CEODashboard';
import { AdminLogin } from './pages/AdminLogin';
import { LegalDocs } from './pages/LegalDocs';
import { OrderHistory } from './pages/OrderHistory';
import { AuraStudio } from './pages/AuraStudio';
import { ChatAssistant } from './components/ChatAssistant';
import { FloatingCart } from './components/FloatingCart';
import { NeuralBackground } from './components/NeuralBackground';

export const App: React.FC = () => {
  return (
    <Router>
      <NeuralBackground />
      <div className="min-h-screen flex flex-col relative">
        <Navigation />
        <FloatingCart />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<VendorOnboarding />} />
            <Route path="/tracking" element={<OrderTracking />} />
            <Route path="/tracking/:orderId" element={<OrderTracking />} />
            <Route path="/dashboard" element={<VendorDashboard />} />
            <Route path="/store/:slug" element={<StoreProfile />} />
            <Route path="/try-on/:id" element={<VirtualTryOn />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/ceo-dashboard" element={<CEODashboard />} />
            <Route path="/legal" element={<LegalDocs />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:orderId" element={<OrderHistory />} />
            <Route path="/studio" element={<AuraStudio />} />
          </Routes>
        </main>
        <ChatAssistant />
        <Footer />
      </div>
    </Router>
  );
};