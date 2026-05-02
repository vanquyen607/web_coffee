import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, User, LogOut, Menu, X, 
  Phone, Clock, MapPin, Instagram, Facebook, 
  Globe, LogIn, Settings, Search
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { useCartUI } from '../context/CartUIContext';

export function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { openCart } = useCartUI();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Thực đơn', path: '/shop' },
    { name: 'Khuyến mãi', path: '/promotions' },
    { name: 'Về chúng tôi', path: '/about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Main Navbar */}
      <nav className={cn(
        "px-4 md:px-6 py-4 lg:py-8 transition-all duration-700 pointer-events-auto",
        isScrolled ? "lg:py-4" : ""
      )}>
        <div className={cn(
          "max-w-7xl mx-auto px-4 md:px-6 py-2.5 md:py-3 rounded-[2rem] lg:rounded-[2.5rem] border transition-all duration-700 flex items-center justify-between",
          isScrolled 
            ? "bg-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-white/20 backdrop-blur-2xl py-2" 
            : "bg-white/40 border-bento-accent/20 backdrop-blur-md"
        )}>
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            <motion.div 
               whileHover={{ rotate: [0, -10, 10, 0] }}
               transition={{ duration: 0.5 }}
               className="w-10 h-10 lg:w-11 lg:h-11 bg-bento-primary rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-bento-primary/20"
            >
              <span className="text-xl lg:text-2xl font-black italic">CT</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm lg:text-base font-black tracking-tighter uppercase leading-none text-bento-primary">Chill Tea</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mt-0.5">Vietnamese Spirit</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 bg-bento-bg/50 p-1.5 rounded-full border border-bento-accent/30">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={link.path}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group",
                    location.pathname === link.path 
                      ? "bg-bento-primary text-white shadow-lg shadow-bento-primary/20" 
                      : "text-bento-text/40 hover:text-bento-primary"
                  )}
                >
                  <span className="relative z-10">{link.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 lg:gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              className="relative p-3 bg-white border border-bento-accent/50 rounded-2xl shadow-sm hover:shadow-xl transition-all group"
            >
              <ShoppingCart className="w-5 h-5 text-bento-primary group-hover:rotate-[15deg] transition-transform" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-white"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="w-[1px] h-6 bg-bento-accent mx-1 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-2 lg:gap-3">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="hidden sm:flex items-center justify-center p-3 bg-white border border-bento-accent rounded-2xl text-bento-primary-dark hover:bg-bento-primary hover:text-white transition-all shadow-sm"
                    title="Quản trị"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                
                <Link 
                  to="/profile"
                  className="group flex items-center gap-3 p-1 pr-3 lg:pr-4 bg-white border border-bento-accent rounded-full hover:shadow-xl transition-all"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-white shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-bento-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 lg:w-5 h-5 text-bento-primary" />
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none truncate max-w-[70px]">{profile?.displayName?.split(' ')[0]}</p>
                    <p className="text-[7px] font-bold text-bento-text/30 mt-1">Member</p>
                  </div>
                </Link>

                <button 
                  onClick={() => logout()}
                  className="p-3 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-2xl transition-all hidden sm:block"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-6 lg:px-8 py-3 lg:py-4 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Thành viên</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-3 bg-white border border-bento-accent rounded-2xl text-bento-primary shadow-sm active:scale-90 transition-all"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-bento-primary-dark/40 backdrop-blur-md lg:hidden pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl z-[60] p-8 md:p-12 flex flex-col lg:hidden"
            >
              <div className="flex justify-between items-center mb-10">
                 <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-bento-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                      <span className="text-base font-black italic">CT</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-black uppercase tracking-tighter text-bento-primary">Chill Tea</span>
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-30">Vietnamese Spirit</span>
                    </div>
                 </Link>
                 <button onClick={() => setIsOpen(false)} className="p-3 bg-bento-bg rounded-2xl active:scale-90 transition-all border border-bento-accent/50">
                  <X className="w-5 h-5 text-bento-text/60" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar py-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block py-3 px-6 rounded-2xl text-2xl font-black tracking-tight uppercase transition-all",
                        location.pathname === link.path 
                          ? "text-bento-primary bg-bento-primary/5" 
                          : "text-bento-text/20 hover:text-bento-primary hover:bg-bento-bg"
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.1 }}
                  >
                    <Link 
                      to="/admin" 
                      onClick={() => setIsOpen(false)} 
                      className="flex items-center gap-4 py-4 px-6 mt-4 border-t border-bento-bg text-sm font-black uppercase text-bento-primary/60 hover:text-bento-primary"
                    >
                      <Settings className="w-4 h-4" /> Bảng quản trị
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="pt-8 border-t border-bento-bg space-y-4">
                 {user && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-[0.98]"
                    >
                      <LogOut className="w-4 h-4" /> Thoát tài khoản
                    </motion.button>
                 )}
                 {!user && (
                    <Link 
                      to="/login"
                      onClick={() => setIsOpen(false)} 
                      className="w-full flex items-center justify-center gap-3 py-5 bg-bento-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-bento-primary/20"
                    >
                      <LogIn className="w-4 h-4" /> Đăng nhập
                    </Link>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
