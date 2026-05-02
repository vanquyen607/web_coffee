import React from 'react';
import { ShoppingCart, Plus, Check, Star, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, CartItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { toast } from './ui/Toaster';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: () => void;
  key?: string | number;
}

export function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [recentlyAdded, setRecentlyAdded] = React.useState(false);
  const isInCart = items.some((i) => i.productId === product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdmin || isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
    setRecentlyAdded(true);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    setTimeout(() => setRecentlyAdded(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onOpenDetails}
      className={cn(
        "group relative bg-white rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-5 border border-bento-accent/50 transition-all duration-700",
        "hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] hover:border-bento-primary/40 hover:-translate-y-2",
        onOpenDetails && "cursor-pointer",
        isOutOfStock && "opacity-80 grayscale-[0.5]"
      )}
    >
      <div className="aspect-[4/5] overflow-hidden relative rounded-[1.5rem] lg:rounded-[2.5rem] bg-bento-bg isolate">
        <motion.img 
          src={product.image} 
          alt={product.name} 
          className={cn(
            "w-full h-full object-cover transition-transform duration-[1200ms] ease-out",
            isOutOfStock && "opacity-50"
          )}
          whileHover={!isOutOfStock ? { scale: 1.12 } : {}}
          referrerPolicy="no-referrer"
        />
        
        {/* Decorative shadow inside image */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-black/5 text-bento-text">
            {product.category}
          </span>
          {product.isPopular && (
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="px-2.5 py-1.5 bg-bento-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-2.5 h-2.5" /> Popular
            </motion.span>
          )}
        </div>

        {/* Quick View Overlay (Mobile & Desktop Tip) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
          <div className="bg-white/80 backdrop-blur-xl py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center shadow-xl border border-white/20">
            Xem chi tiết
          </div>
        </div>

        {isOutOfStock && (
           <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
             <div className="w-full py-2 bg-rose-500/90 backdrop-blur-sm shadow-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] text-center rotate-[-12deg] border-y border-white/20">
               Hết hàng
             </div>
           </div>
        )}
      </div>

      <div className="pt-6 pb-2 px-1">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 min-w-0">
               <h3 className="font-black text-sm md:text-xl tracking-tighter text-bento-text leading-tight line-clamp-1">{product.name}</h3>
               <p className="text-bento-primary font-bold text-base md:text-xl tracking-tighter">{formatCurrency(product.price)}</p>
            </div>
            
            {!isAdmin && !isOutOfStock && (
              <motion.button
                onClick={handleAddToCart}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 border border-transparent",
                  recentlyAdded 
                    ? "bg-green-500 text-white" 
                    : isInCart 
                      ? "bg-bento-bg text-bento-primary border-bento-accent" 
                      : "bg-bento-text text-white hover:bg-bento-primary"
                )}
              >
                {recentlyAdded ? <Check className="w-5 h-5 md:w-6 h-6" /> : isInCart ? <ShoppingCart className="w-5 h-5 md:w-6 h-6" /> : <Plus className="w-5 h-5 md:w-6 h-6" />}
              </motion.button>
            )}
          </div>

          <p className="text-bento-text/40 text-[9px] md:text-xs font-medium leading-[1.6] line-clamp-2 italic border-l-2 border-bento-accent pl-3">
            {product.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
