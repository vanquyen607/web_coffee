/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import Promotions from './pages/Promotions';
import { CartProvider } from './context/CartContext';
import { CartUIProvider } from './context/CartUIContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/Toaster';
import { CartDrawer } from './components/CartDrawer';
import { ScrollToTop } from './components/ScrollToTop';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';

function PageLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { scrollYProgress } = useScroll();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-bento-primary z-[100] origin-left"
        style={{ scaleX }}
      />
      <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartUIProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-bento-bg text-bento-text font-sans selection:bg-bento-primary selection:text-white">
              <Navbar />
              <CartDrawer />
              <main className="pt-20">
                <PageLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/promotions" element={<Promotions />} />
                  </Routes>
                </PageLayout>
              </main>
              <Footer />
              <Toaster />
              <ScrollToTop />
            </div>
          </BrowserRouter>
        </CartUIProvider>
      </CartProvider>
    </AuthProvider>
  );
}
