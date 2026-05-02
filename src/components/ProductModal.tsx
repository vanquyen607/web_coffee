import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, ShoppingCart, Check, MessageSquare, 
  Send, User, Clock, Trash2, Plus, Minus,
  Flame, Clock3, Info, Share2, Heart
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, deleteDoc, doc, getDocs, limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Review } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from './ui/Toaster';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem, items } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Customization state
  const [sugar, setSugar] = useState('100%');
  const [ice, setIce] = useState('100%');
  const [note, setNote] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const isInCart = items.some((i) => i.productId === product?.id && i.options?.sugar === sugar && i.options?.ice === ice);
  const isOutOfStock = product ? product.stock <= 0 : false;

  useEffect(() => {
    if (!product) return;

    // Reset customizations for the new product
    setSugar('100%');
    setIce('100%');
    setNote('');
    setItemQuantity(1);
    setRecentlyAdded(false);

    // Fetch related products
    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', product.category),
          where('active', '==', true),
          limit(4)
        );
        const snapshot = await getDocs(q);
        setRelatedProducts(snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.id !== product.id)
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'products_related');
      }
    };

    fetchRelated();

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', product.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      setLoadingReviews(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reviews');
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Khách hàng',
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });
      setComment('');
      setRating(5);
      toast.success('Cảm ơn bạn đã đánh giá!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success('Đã xóa đánh giá');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 0;

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bento-text/40 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative bg-white w-full max-w-6xl h-[94vh] lg:h-[88vh] rounded-[2.5rem] lg:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row overflow-hidden border border-white/20"
          >
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Product Visuals */}
            <div className="lg:w-1/2 h-[40vh] lg:h-full bg-bento-bg relative overflow-hidden shrink-0">
               <motion.img 
                 initial={{ scale: 1.1 }}
                 animate={{ scale: 1 }}
                 transition={{ duration: 1.5 }}
                 src={product.image} 
                 alt={product.name} 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
               
               {/* Categories & Badges Overlay */}
               <div className="absolute top-8 left-8 flex flex-col gap-3">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-white/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Info className="w-3 h-3 text-bento-primary" /> {product.category}
                  </motion.div>
                  {product.isPopular && (
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="px-4 py-2 bg-bento-primary text-white rounded-2xl shadow-xl shadow-bento-primary/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <Star className="w-3 h-3 fill-current" /> Best Seller
                    </motion.div>
                  )}
               </div>

               {/* Interaction Buttons Overlay */}
               <div className="absolute bottom-8 right-8 flex gap-3">
                  <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl border border-white/50 flex items-center justify-center hover:bg-white transition-all active:scale-95 shadow-xl">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </button>
                  <button className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl border border-white/50 flex items-center justify-center hover:bg-white transition-all active:scale-95 shadow-xl">
                    <Share2 className="w-5 h-5 text-bento-text" />
                  </button>
               </div>
            </div>

            {/* Right Side: Details & Interaction */}
            <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
               {/* Desktop Close */}
               <button 
                  onClick={onClose}
                  className="absolute top-10 right-10 z-50 p-4 bg-bento-bg rounded-2xl border border-bento-accent hidden lg:flex items-center justify-center hover:rotate-90 transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>

               <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                  <div className="p-8 md:p-12 lg:p-16 space-y-12">
                     {/* Title & Description Bento */}
                     <div className="space-y-6">
                        <motion.h2 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]"
                        >
                          {product.name}
                        </motion.h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           <div className="p-4 bg-bento-bg/50 rounded-2xl border border-bento-accent/30 space-y-1">
                              <p className="text-[9px] font-black text-bento-text/30 uppercase tracking-widest uppercase">Thanh toán</p>
                              <p className="text-xl font-black text-bento-primary">{formatCurrency(product.price)}</p>
                           </div>
                           <div className="p-4 bg-bento-bg/50 rounded-2xl border border-bento-accent/30 space-y-1">
                              <div className="flex items-center gap-2">
                                <Flame className="w-3 h-3 text-orange-500" />
                                <p className="text-[9px] font-black text-bento-text/30 uppercase tracking-widest">Năng lượng</p>
                              </div>
                              <p className="text-xl font-black">~240 <span className="text-[10px] text-bento-text/40">kcal</span></p>
                           </div>
                           <div className="p-4 bg-bento-bg/50 rounded-2xl border border-bento-accent/30 space-y-1 hidden md:block">
                              <div className="flex items-center gap-2">
                                <Clock3 className="w-3 h-3 text-blue-500" />
                                <p className="text-[9px] font-black text-bento-text/30 uppercase tracking-widest">Pha chế</p>
                              </div>
                              <p className="text-xl font-black">5 - 8 <span className="text-[10px] text-bento-text/40">phút</span></p>
                           </div>
                        </div>
                        <p className="text-base text-bento-text/50 font-medium leading-relaxed border-l-4 border-bento-primary pl-6 py-2">
                          {product.description}
                        </p>
                     </div>

                     {/* Customization Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(product.category.includes('Tea') || product.category.includes('Coffee')) && (
                          <>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-primary">Mức đường</p>
                                 <span className="text-[10px] font-bold text-bento-text/30">{sugar} sweet</span>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                  {['0%', '50%', '70%', '100%'].map((lvl) => (
                                    <button
                                      key={lvl}
                                      onClick={() => setSugar(lvl)}
                                      className={cn(
                                        "px-4 py-3 rounded-xl text-[9px] font-black tracking-widest border transition-all active:scale-95 text-center",
                                        sugar === lvl 
                                          ? "bg-bento-primary text-white border-bento-primary shadow-lg shadow-bento-primary/20" 
                                          : "bg-white text-bento-text/40 border-bento-accent hover:border-bento-primary/30"
                                      )}
                                    >
                                      {lvl === '0%' ? 'KHÔNG ĐƯỜNG' : lvl}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-primary">Mức đá</p>
                                 <span className="text-[10px] font-bold text-bento-text/30">{ice} ice</span>
                               </div>
                               <div className="grid grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-2">
                                  {['0%', '50%', '100%'].map((lvl) => (
                                    <button
                                      key={lvl}
                                      onClick={() => setIce(lvl)}
                                      className={cn(
                                        "px-4 py-3 rounded-xl text-[9px] font-black tracking-widest border transition-all active:scale-95 text-center",
                                        ice === lvl 
                                          ? "bg-bento-primary text-white border-bento-primary shadow-lg shadow-bento-primary/20" 
                                          : "bg-white text-bento-text/40 border-bento-accent hover:border-bento-primary/30"
                                      )}
                                    >
                                      {lvl === '0%' ? 'KHÔNG ĐÁ' : lvl}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          </>
                        )}
                     </div>

                     {/* Note Box */}
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-primary">Ghi chú đặc biệt</p>
                        <textarea 
                          placeholder="VD: Không lấy trân châu, ít ngọt, cho thêm đá..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full bg-bento-bg/30 border border-bento-accent rounded-3xl px-8 py-5 text-sm font-medium focus:outline-none focus:ring-8 focus:ring-bento-primary/5 min-h-[100px] resize-none"
                        />
                     </div>

                     {/* Recommendations */}
                     {relatedProducts.length > 0 && (
                        <div className="space-y-6">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-primary">Combo đề xuất</p>
                           <div className="grid grid-cols-2 gap-4">
                              {relatedProducts.map(rp => (
                                <div key={rp.id} className="group/item flex items-center gap-4 bg-bento-bg/20 p-3 rounded-2xl border border-bento-accent transition-all hover:bg-white hover:shadow-xl hover:border-bento-primary/20 cursor-pointer">
                                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-bento-accent transform group-hover/item:scale-110 transition-transform duration-500">
                                     <img src={rp.image} className="w-full h-full object-cover" alt={rp.name} />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-[10px] font-black leading-tight line-clamp-1 uppercase">{rp.name}</p>
                                     <p className="text-[11px] font-bold text-bento-primary">{formatCurrency(rp.price)}</p>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Reviews Summary Header */}
                     <div className="py-12 border-t border-bento-accent space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                           <div className="space-y-2">
                              <h3 className="text-3xl font-black uppercase tracking-tighter">Đánh giá thực tế</h3>
                              <p className="text-sm text-bento-text/40 font-medium">Từ cộng đồng yêu trà sữa {product.name}</p>
                           </div>
                           <div className="flex items-center gap-6 p-4 bg-bento-bg/50 rounded-[2rem] border border-bento-accent">
                              <div className="text-center md:text-left">
                                 <div className="flex items-center gap-2">
                                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                                    <span className="text-3xl font-black tracking-tighter">{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}</span>
                                 </div>
                                 <p className="text-[9px] font-black text-bento-text/30 uppercase tracking-widest">{reviews.length} lượt đánh giá</p>
                              </div>
                              <div className="w-px h-10 bg-bento-accent" />
                              <div className="flex -space-x-3">
                                 {[1,2,3,4].map(i => (
                                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-bento-bg flex items-center justify-center overflow-hidden">
                                      <User className="w-5 h-5 text-bento-text/20" />
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Review Form */}
                        {user && !isAdmin && (
                          <div className="p-8 bg-bento-text rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-bento-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                             
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                   <h4 className="text-xl font-black uppercase tracking-tighter">Chia sẻ vị giác của bạn</h4>
                                   <p className="text-xs text-white/40 font-medium tracking-widest">Cảm nhận của bạn giúp chúng tôi hoàn thiện hơn</p>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                                   {[1,2,3,4,5].map(i => (
                                     <button 
                                       key={i} 
                                       type="button"
                                       onClick={() => setRating(i)}
                                       className={cn(
                                         "p-2 rounded-xl transition-all active:scale-125",
                                         i <= rating ? "bg-amber-400/10" : "hover:bg-white/5"
                                       )}
                                     >
                                       <Star className={cn("w-5 h-5", i <= rating ? "fill-amber-400 text-amber-400" : "text-white/10")} />
                                     </button>
                                   ))}
                                </div>
                             </div>

                             <div className="relative">
                                <textarea 
                                  placeholder="Nhận xét về hương vị, độ ngọt, trân châu..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-bento-primary/20 min-h-[120px] resize-none"
                                />
                                <button
                                  onClick={handleSubmitReview}
                                  disabled={submitting || !comment.trim()}
                                  className="absolute bottom-4 right-4 px-8 py-4 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:brightness-110 active:scale-95 disabled:opacity-30 transition-all flex items-center gap-3"
                                >
                                  {submitting ? 'Đang gửi...' : 'Gửi nhận xét'} <Send className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        )}

                        {/* Review List */}
                        <div className="grid gap-6">
                           {loadingReviews ? (
                             <div className="space-y-6">
                               {[1,2].map(i => <div key={i} className="h-32 bg-bento-bg rounded-[2.5rem] animate-pulse" />)}
                             </div>
                           ) : reviews.length === 0 ? (
                             <div className="text-center py-20 bg-bento-bg/30 rounded-[3rem] border border-dashed border-bento-accent">
                               <p className="text-xs font-black uppercase tracking-widest text-bento-text/20">Trở thành người đầu tiên cảm nhận món ngon này</p>
                             </div>
                           ) : (
                             reviews.map((rv) => (
                                <motion.div 
                                  layout
                                  key={rv.id} 
                                  className="group p-8 bg-white rounded-[2.5rem] border border-bento-accent/60 transition-all hover:bg-bento-bg/10 hover:shadow-2xl relative"
                                >
                                   <div className="flex justify-between items-start mb-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-14 h-14 rounded-2xl bg-bento-bg flex items-center justify-center text-bento-primary shadow-inner">
                                            <User className="w-7 h-7" />
                                         </div>
                                         <div className="space-y-1">
                                            <p className="text-sm font-black tracking-tight">{rv.userName}</p>
                                            <div className="flex gap-1">
                                               {[1,2,3,4,5].map(i => (
                                                  <Star key={i} className={cn("w-3 h-3 text-amber-400", i <= rv.rating ? "fill-amber-400" : "opacity-10")} />
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <span className="text-[10px] font-black text-bento-text/20 tracking-tighter">
                                            {rv.createdAt?.toDate ? rv.createdAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}
                                         </span>
                                         {(user?.uid === rv.userId || isAdmin) && (
                                           <button 
                                             onClick={() => handleDeleteReview(rv.id)}
                                             className="p-3 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-2xl transition-all"
                                           >
                                             <Trash2 className="w-4 h-4" />
                                           </button>
                                         )}
                                      </div>
                                   </div>
                                   <div className="pl-18">
                                     <p className="text-sm md:text-base font-medium text-bento-text/60 leading-relaxed bg-white/50 p-6 rounded-[2rem] border border-bento-accent/30 italic">
                                       "{rv.comment}"
                                     </p>
                                   </div>
                                </motion.div>
                             ))
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Interaction Footer Sticky Inside Detail */}
               <div className="p-8 lg:p-10 bg-white/95 backdrop-blur-xl border-t border-bento-accent flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.05)] z-40">
                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-bento-text/20 uppercase tracking-widest">Thành tiền</p>
                        <p className="text-3xl font-black text-bento-primary tracking-tighter">{formatCurrency(product.price * itemQuantity)}</p>
                     </div>
                     <div className="flex items-center gap-4 bg-bento-bg p-2 rounded-2xl border border-bento-accent">
                        <button 
                          onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-xl shadow-md hover:text-bento-primary transition-all active:scale-90 disabled:opacity-30"
                          disabled={itemQuantity <= 1}
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-xl font-black w-8 text-center">{itemQuantity}</span>
                        <button 
                          onClick={() => setItemQuantity(itemQuantity + 1)}
                          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-xl shadow-md hover:text-bento-primary transition-all active:scale-90"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                     </div>
                  </div>

                  <motion.button
                    onClick={() => {
                      if (isOutOfStock) return;
                      addItem({ 
                        productId: product.id, 
                        name: product.name, 
                        price: product.price, 
                        quantity: itemQuantity,
                        image: product.image,
                        options: { sugar, ice, note }
                      });
                      setRecentlyAdded(true);
                      toast.success(`Đã thêm ${itemQuantity} ${product.name} vào giỏ!`);
                      setTimeout(() => setRecentlyAdded(false), 2000);
                    }}
                    disabled={isInCart || isAdmin || isOutOfStock}
                    animate={recentlyAdded ? { scale: [1, 1.05, 1], backgroundColor: ["#E9EDC9", "#CCD5AE", "#E9EDC9"] } : { scale: 1 }}
                    className={cn(
                      "w-full md:w-64 h-16 md:h-20 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-4 shadow-2xl",
                      isOutOfStock 
                        ? "bg-bento-bg text-bento-text/20 cursor-not-allowed" 
                        : (isInCart || recentlyAdded)
                          ? "bg-bento-bg text-bento-primary/30 cursor-default" 
                          : "bg-bento-primary text-white hover:brightness-110 active:scale-95 shadow-bento-primary/30"
                    )}
                  >
                    {isOutOfStock ? (
                      <><ShoppingCart className="w-5 h-5 opacity-20" /> Tạm hết hàng</>
                    ) : recentlyAdded ? (
                      <><Check className="w-5 h-5" /> Đã thêm!</>
                    ) : isInCart ? (
                      <><Check className="w-5 h-5" /> Đã có sẵn</>
                    ) : (
                      <><ShoppingCart className="w-5 h-5" /> Thêm vào đơn</>
                    )}
                  </motion.button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
