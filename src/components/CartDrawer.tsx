import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

export function CartDrawer() {
  const { items, total, itemCount, updateQuantity, removeItem } = useCart();
  const { isCartOpen, closeCart } = useCartUI();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-bento-accent flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bento-primary rounded-xl flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Giỏ hàng</h2>
                  <span className="text-[10px] font-bold text-bento-text/30 uppercase tracking-[0.2em]">{itemCount} món đã chọn</span>
                </div>
              </div>
              <button 
                onClick={closeCart}
                className="w-10 h-10 rounded-full bg-bento-bg flex items-center justify-center hover:bg-bento-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-bento-bg rounded-full flex items-center justify-center text-bento-text/10">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-bold text-bento-text/30 uppercase tracking-widest">Giỏ hàng đang trống</p>
                  <button 
                    onClick={closeCart}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-bento-primary hover:underline"
                  >
                    Bắt đầu mua sắm ngay
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <motion.div 
                    key={`${item.productId}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-20 h-20 bg-bento-bg rounded-2xl overflow-hidden shrink-0">
                      {item.image && (
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold tracking-tight">{item.name}</h4>
                      {item.options && (
                        <div className="space-y-0.5">
                          {(item.options.sugar || item.options.ice) && (
                            <p className="text-[8px] font-black uppercase text-bento-text/30 tracking-widest">
                              {item.options.sugar && `S: ${item.options.sugar}`}
                              {item.options.sugar && item.options.ice && ' | '}
                              {item.options.ice && `I: ${item.options.ice}`}
                            </p>
                          )}
                          {item.options.note && (
                            <p className="text-[8px] font-bold text-bento-primary/60 italic truncate max-w-[180px]">
                              "{item.options.note}"
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs font-black text-bento-primary">{formatCurrency(item.price)}</p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3 bg-bento-bg rounded-lg p-1 scale-90 -ml-2">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.options)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.options)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId, item.options)}
                          className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 border-t border-bento-accent bg-white space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-text/30">Tổng cộng</span>
                  <span className="text-2xl font-black tracking-tighter text-bento-primary-dark">{formatCurrency(total)}</span>
                </div>
                <Link 
                  to="/checkout" 
                  onClick={closeCart}
                  className="w-full bg-bento-text text-white py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-bento-primary transition-all shadow-xl active:scale-[0.98] group"
                >
                  Xác nhận đơn hàng <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
