import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Truck, ShieldCheck, Heart, Droplets, 
  Sparkles, Award, Star, Coffee, Leaf, Zap, 
  Clock, CheckCircle2, MapPin, Instagram, Facebook,
  Search, SlidersHorizontal, Filter, MessageSquare, User, Trash2, Send, X, Plus, Minus, ShoppingCart
} from 'lucide-react';
import { collection, query, where, limit, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { AIDrinkMatcher } from '../components/AIDrinkMatcher';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { cn } from '../lib/utils';

const DEFAULT_SLIDES = [
  {
    title: "TRÀ SỮA",
    subtitle: "ĐẬM VỊ NGUYÊN BẢN",
    description: "Khám phá hương vị trà sữa trân châu truyền thống với trà đen chọn lọc và sữa béo ngậy, mang lại cảm giác 'Chill' tuyệt đối trong từng ngụm.",
    image: "https://images.unsplash.com/photo-1544145945-f904253db0ad?w=1920&q=100",
    color: "bg-[#F3EFE0]",
    accent: "text-bento-primary",
    feature: "Premium Choice"
  },
  {
    title: "TRÀ TRÁI CÂY",
    subtitle: "TƯƠI MỚI MỖI NGÀY",
    description: "Sự kết hợp hoàn hảo giữa trà xanh thượng hạng và trái cây tươi nhiệt đới. Giải nhiệt tức thì, bừng tỉnh năng lượng cho ngày dài năng động.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1920&q=100",
    color: "bg-[#E9EDC9]",
    accent: "text-bento-primary",
    feature: "Seasonal Fresh"
  },
  {
    title: "MATCHA COZY",
    subtitle: "TĨNH LẶNG TÂM HỒN",
    description: "Bột Matcha nguyên chất từ Uji Nhật Bản, hòa quyện tinh tế cùng sữa tươi. Một lựa chọn nhẹ nhàng cho những khoảnh khắc cần sự bình yên.",
    image: "https://images.unsplash.com/photo-1594914141274-749178396717?w=1920&q=100",
    color: "bg-[#CCD5AE]",
    accent: "text-bento-primary",
    feature: "Authentic Taste"
  }
];

export function Home() {
  const { isAdmin } = useAuth();
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDES);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [isCategorySticky, setIsCategorySticky] = useState(false);

  const CATEGORIES = ['Tất cả', 'Milk Tea', 'Fruit Tea', 'Coffee', 'Bakery'];

  // Handle sticky category bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const categorySection = document.getElementById('category-nav');
      if (categorySection) {
        const rect = categorySection.getBoundingClientRect();
        setIsCategorySticky(rect.top <= 80);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic slides from Firestore
  useEffect(() => {
    const q = query(collection(db, 'slides'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setSlides(DEFAULT_SLIDES);
      }
    }, (err) => {
      console.warn("Failed to fetch dynamic slides, using defaults:", err);
      setSlides(DEFAULT_SLIDES);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setLoading(true);
        let q;
        const productsRef = collection(db, 'products');
        
        let constraints = [where('active', '==', true)];
        
        if (selectedCategory !== 'Tất cả') {
          constraints.push(where('category', '==', selectedCategory));
        } else {
          constraints.push(where('isPopular', '==', true));
        }

        // Apply sorting (Note: Firestore requires index for complex sort + where)
        // For simplicity and to avoid index errors, we'll do basic sorting
        q = query(productsRef, ...constraints, limit(12));
        
        const snapshot = await getDocs(q);
        let products = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Product));

        // Client-side filtering for search and advanced sorting
        if (searchTerm) {
          products = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        if (sortBy === 'price-low') {
          products.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
          products.sort((a, b) => b.price - a.price);
        }

        setFeaturedProducts(products);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'products');
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, [selectedCategory, searchTerm, sortBy]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  useEffect(() => {
    if (!isAdmin) {
      setRecentOrders([]);
      return;
    }

    const q = query(collection(db, 'orders'), where('status', '==', 'completed'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
    }, (error) => {
      console.warn("Recent orders marquee limited to admin access");
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative space-y-24 pb-24 lg:pt-32 pt-24 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] -left-20 w-96 h-96 bg-bento-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[40%] -right-20 w-80 h-80 bg-[#CCD5AE]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-bento-bg/20 rounded-full blur-3xl" />
      </div>

      {/* Editorial Hero Slider - Redesigned */}
      <section className="relative h-[85vh] md:h-[80vh] lg:h-[92vh] min-h-[600px] overflow-hidden lg:mx-4 lg:rounded-[3.5rem] bg-bento-text border border-white/10 group shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* Background Image with Ken Burns Effect */}
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute inset-0"
            >
              <img 
                src={slides[currentSlide]?.image} 
                className="w-full h-full object-cover"
                alt={slides[currentSlide]?.title}
              />
              {/* Overlays for depth */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden lg:block" />
            </motion.div>

            {/* Content Container */}
            <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 flex flex-col justify-center items-start pt-20">
               <div className="max-w-4xl space-y-6 md:space-y-10">
                 <div className="overflow-hidden flex items-center gap-4">
                    <motion.div 
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="w-12 h-[2px] bg-bento-primary origin-left"
                    />
                    <motion.span 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white/60"
                    >
                      {slides[currentSlide]?.feature}
                    </motion.span>
                 </div>

                 <div className="space-y-4">
                    <motion.h2 
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 1 }}
                      className="text-2xl md:text-4xl font-black text-bento-primary italic tracking-tight"
                    >
                      {slides[currentSlide]?.subtitle}
                    </motion.h2>
                    <motion.h1 
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.9, duration: 1 }}
                      className="text-5xl md:text-8xl lg:text-[10vw] font-black text-white tracking-tighter leading-[0.8] mix-blend-plus-lighter"
                    >
                      {slides[currentSlide]?.title}
                    </motion.h1>
                 </div>

                 <motion.p 
                   initial={{ y: 30, opacity: 0 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 1.1, duration: 1 }}
                   className="text-sm md:text-lg text-white/60 max-w-xl font-medium leading-relaxed drop-shadow-lg"
                 >
                   {slides[currentSlide]?.description}
                 </motion.p>

                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ delay: 1.3, duration: 0.8 }}
                   className="pt-6"
                 >
                    <Link to="/shop" className="group relative inline-flex items-center gap-6 px-12 py-6 bg-white text-bento-text rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs transition-all hover:pr-16 active:scale-95 shadow-2xl overflow-hidden">
                      <span className="relative z-10">Thưởng thức ngay</span>
                      <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
                      <div className="absolute inset-0 bg-bento-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </Link>
                 </motion.div>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Counter & Controls Overlay */}
        <div className="absolute bottom-10 left-6 md:left-16 right-6 md:right-16 flex items-end justify-between z-30">
          {/* Progress Indicators */}
          <div className="flex flex-col gap-8 items-start">
             <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-white leading-none">0{currentSlide + 1}</span>
                <span className="text-sm md:text-base font-bold text-white/30">/ 0{slides.length}</span>
             </div>
             <div className="flex gap-3">
                {slides.map((_, i) => (
                   <button 
                     key={i}
                     onClick={() => setCurrentSlide(i)}
                     className={cn(
                       "h-1.5 rounded-full transition-all duration-700",
                       currentSlide === i ? "w-12 bg-bento-primary" : "w-6 bg-white/20 hover:bg-white/40"
                     )}
                   />
                ))}
             </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex gap-4 p-2 bg-black/20 backdrop-blur-xl rounded-[2rem] border border-white/10">
             <button 
               onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
               className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90"
             >
               <ArrowRight className="w-7 h-7 rotate-180" />
             </button>
             <button 
               onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
               className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-bento-primary text-white flex items-center justify-center hover:scale-105 shadow-xl transition-all active:scale-90"
             >
               <ArrowRight className="w-7 h-7" />
             </button>
          </div>
        </div>

        {/* Top Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 z-40">
           <motion.div 
             key={currentSlide}
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 6, ease: "linear" }}
             className="h-full bg-bento-primary origin-left"
           />
        </div>
      </section>

      {/* Live Activity Marquee */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white border-y border-bento-accent py-4 overflow-hidden relative group"
      >
        <div className="flex animate-marquee group-hover:pause gap-12 whitespace-nowrap px-6">
           {recentOrders.length > 0 ? recentOrders.map((order, i) => (
             <div key={i} className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/40">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Khách hàng tại {order.customerAddress?.split(',').pop()?.trim() || 'Saigon'} vừa nhận {order.items[0]?.name}</span>
                <span className="opacity-20">•</span>
             </div>
           )) : (
             <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/40">
                <div className="w-2 h-2 rounded-full bg-bento-primary animate-pulse" />
                <span>Chào mừng bạn đến với Chill Tea Vietnam</span>
                <span className="opacity-20">•</span>
                <span>Hơn 2,000 khách hàng đã Chill hôm nay</span>
                <span className="opacity-20">•</span>
                <span>Nguyên liệu tươi sạch 100% tự nhiên</span>
             </div>
           )}
           {/* Duplicate for seamless marquee */}
           {recentOrders.map((order, i) => (
             <div key={`dup-${i}`} className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/40">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Khách hàng tại {order.customerAddress?.split(',').pop()?.trim() || 'Saigon'} vừa nhận {order.items[0]?.name}</span>
                <span className="opacity-20">•</span>
             </div>
           ))}
        </div>
      </motion.section>

      {/* Featured Menu - Horizontal Spotlight */}
      <motion.section 
        id="category-nav"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-4 md:px-6"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-bento-primary animate-pulse" />
                 <span className="text-bento-primary font-black uppercase tracking-[0.4em] text-[10px]">Spotlight</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase leading-[0.85]">CHỌN VỊ <br/> <span className="opacity-10 text-bento-text">BẠN YÊU</span></h2>
           </div>
           
           <div className="flex flex-col w-full lg:w-auto gap-6 group">
             {/* Search & Sort Controls */}
             <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="relative flex-1 sm:min-w-[300px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/30" />
                  <input 
                    type="text" 
                    placeholder="Tìm tên món or hương vị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-bento-bg border border-bento-accent rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-bento-primary/5 transition-all"
                  />
                </div>
                <div className="relative">
                  <SlidersHorizontal className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/30" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto pl-12 pr-10 py-4 bg-bento-bg border border-bento-accent rounded-2xl text-xs font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-bento-primary/5 cursor-pointer"
                  >
                    <option value="popular">Phổ biến nhất</option>
                    <option value="price-low">Giá thấp đến cao</option>
                    <option value="price-high">Giá cao đến thấp</option>
                  </select>
                </div>
             </div>

             {/* Categories - Sticky on Mobile */}
             <div className={cn(
               "flex bg-white/80 backdrop-blur-3xl p-1.5 rounded-2xl border border-bento-accent overflow-x-auto no-scrollbar snap-x transition-all duration-500",
               isCategorySticky ? "fixed top-24 left-4 right-4 z-40 shadow-2xl border-white ring-1 ring-black/5" : "relative"
             )}>
               {CATEGORIES.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => {
                     setSelectedCategory(cat);
                     if (isCategorySticky) {
                        window.scrollTo({ top: document.getElementById('category-nav')?.offsetTop! - 100, behavior: 'smooth' });
                     }
                   }}
                   className={cn(
                     "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap snap-start",
                     selectedCategory === cat 
                       ? "bg-bento-primary text-white shadow-lg shadow-bento-primary/20" 
                       : "text-bento-text/30 hover:text-bento-text/60"
                   )}
                 >
                   {cat}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="py-24 text-center bg-bento-bg/30 rounded-[3rem] border border-dashed border-bento-accent">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
               <Search className="w-6 h-6 text-bento-text/20" />
             </div>
             <p className="text-sm font-black uppercase tracking-widest text-bento-text/30">Không tìm thấy món bạn yêu cầu...</p>
             <button onClick={() => {setSearchTerm(''); setSelectedCategory('Tất cả');}} className="mt-6 text-[10px] font-black uppercase tracking-widest text-bento-primary border-b border-bento-primary pb-1">Xem tất cả menu</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10">
            {featuredProducts.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
                className={cn(
                   "lg:col-span-3 h-full",
                   i === 0 && !searchTerm ? "lg:col-span-6" : ""
                )}
              >
                <div className={cn("h-full transition-transform duration-500", i === 0 && !searchTerm ? "lg:hover:scale-[1.01]" : "lg:hover:scale-[1.03]")}>
                  <ProductCard 
                    product={p} 
                    onOpenDetails={() => setSelectedProduct(p)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* AI Drink Matcher - Smart Upsell */}
      <AIDrinkMatcher onOpenDetails={(p) => setSelectedProduct(p)} />

      {/* The Bento Philosophy - Why Us */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6"
      >
         <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* Main Story Card */}
            <div className="md:col-span-12 lg:col-span-7 lg:row-span-2 bg-[#E9EDC9] rounded-[3rem] lg:rounded-[4rem] p-8 md:p-12 lg:p-16 flex flex-col justify-between group overflow-hidden relative border border-[#CCD5AE] shadow-inner">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
                  <Leaf className="w-64 h-64" />
               </div>
               <div className="space-y-6 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-bento-primary shadow-xl ring-4 ring-white/20">
                    <Award className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl md:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase leading-none">Chất lượng <br/> tạo nên linh hồn</h3>
                  <p className="text-base md:text-lg text-bento-primary-dark font-medium leading-relaxed max-w-sm">Chúng tôi tin rằng mỗi tạch trà đều kể một câu chuyện. Từ những lá trà tinh túy nhất.</p>
               </div>
               <div className="flex items-center gap-6 relative z-10 pt-8 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-3xl md:text-4xl font-display font-black leading-none">100%</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Tự nhiên</span>
                  </div>
                  <div className="w-[1px] h-10 bg-bento-primary/20" />
                  <div className="flex flex-col">
                    <span className="text-3xl md:text-4xl font-display font-black leading-none">24h</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Nấu mới</span>
                  </div>
               </div>
            </div>

            {/* Fast Service Card */}
            <div className="md:col-span-6 lg:col-span-5 bg-white rounded-[3rem] p-8 lg:p-10 border border-bento-accent flex flex-col justify-center space-y-4 hover:shadow-xl transition-all group overflow-hidden">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-bento-bg rounded-2xl flex items-center justify-center text-bento-primary group-hover:bg-bento-primary group-hover:text-white transition-colors">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black uppercase tracking-tight">Giao hàng cấp tốc</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Dưới 30 phút</p>
                  </div>
               </div>
               <p className="text-xs md:text-sm font-medium text-bento-text/50 leading-relaxed line-clamp-2">Đảm bảo trà của bạn luôn lạnh, bánh luôn giòn khi đến tay.</p>
            </div>

            {/* Ingredients Card */}
            <div className="md:col-span-6 lg:col-span-5 bg-bento-primary-dark rounded-[3rem] p-8 lg:p-10 text-white flex flex-col justify-center items-center text-center space-y-4 group overflow-hidden relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.05),transparent)] pointer-events-none" />
               <Zap className="w-7 h-7 text-bento-accent mb-1 relative z-10" />
               <h4 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight relative z-10">TƯƠI MỚI MỖI NGÀY</h4>
               <p className="text-[10px] md:text-xs text-white/50 font-medium tracking-wide max-w-[200px] relative z-10 line-clamp-2">Nguyên liệu nhập trực tiếp từ trang trại mỗi sáng để giữ trọn vị.</p>
            </div>
         </div>
      </motion.section>

      {/* Seasonal Promo Section - Boxed Design */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="bg-bento-text text-white py-16 md:py-24 lg:py-32 relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,_#4A5D45_0%,transparent_70%)] opacity-20 pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
             <div className="space-y-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Exclusive Membership</span>
                  <h2 className="text-5xl lg:text-7xl font-display font-black tracking-tighter uppercase leading-[0.85]">GIA NHẬP <br/> <span className="text-bento-primary">CHILL CLUB</span></h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                   {[
                     { icon: <Heart className="w-5 h-5" />, text: "Ưu đãi 20% đơn đầu" },
                     { icon: <Droplets className="w-5 h-5" />, text: "Thử món mới sớm nhất" },
                     { icon: <ShieldCheck className="w-5 h-5" />, text: "Tích điểm đổi quà" },
                     { icon: <Zap className="w-5 h-5" />, text: "Quà tặng sinh nhật" },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-bento-primary group-hover:bg-bento-primary group-hover:text-white transition-all border border-white/5">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.text}</span>
                     </div>
                   ))}
                </div>
  
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                   <Link to="/register" className="px-10 py-5 bg-bento-primary text-white rounded-full font-black uppercase tracking-widest text-[9px] shadow-2xl hover:bg-white hover:text-bento-primary transition-all text-center">
                      Đăng ký thành viên
                   </Link>
                   <Link to="/shop" className="px-10 py-5 border border-white/20 text-white rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-white/5 transition-all text-center">
                      Xem Menu Chill
                   </Link>
                </div>
             </div>
  
             <div className="hidden lg:grid grid-cols-2 gap-4 relative h-full">
                <div className="space-y-4 translate-y-8">
                   <div className="aspect-[4/5] bg-gray-900 rounded-[2.5rem] overflow-hidden border border-white/10">
                      <img src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Lifestyle" />
                   </div>
                   <div className="aspect-square bg-bento-primary rounded-[2.5rem] p-8 flex flex-col justify-end border border-white/10">
                      <Star className="w-6 h-6 text-white mb-3" />
                      <p className="text-lg font-black tracking-tight uppercase leading-tight">THANH VIÊN <br/> ƯU TÚ</p>
                   </div>
                </div>
                <div className="space-y-4 -translate-y-4">
                   <div className="aspect-square bg-white text-bento-text rounded-[2.5rem] p-8 flex flex-col justify-end border border-white/10 shadow-xl">
                      <Zap className="w-6 h-6 text-bento-primary mb-3" />
                      <p className="text-lg font-black tracking-tight uppercase leading-tight">OPEN <br/> 7:00 AM</p>
                   </div>
                   <div className="aspect-[4/5] bg-gray-900 rounded-[2.5rem] overflow-hidden border border-white/10">
                      <img src="https://images.unsplash.com/photo-1544467316-e97029d2d483?w=600" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Lifestyle" />
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Social proof marquee simplified */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <div className="flex gap-1 text-yellow-500">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase font-display italic">Trải nghiệm đỉnh cao được chứng thực</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-20 grayscale hover:opacity-50 transition-all duration-700">
           <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-black tracking-tighter">DISTRICT 1</span>
           </div>
           <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-black tracking-tighter">DISTRICT 3</span>
           </div>
           <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-black tracking-tighter">DISTRICT 7</span>
           </div>
           <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span className="text-xl font-black tracking-tighter">DISTRICT 10</span>
           </div>
        </div>
      </section>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}

