import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ChevronDown, ShoppingCart } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { cn } from '../lib/utils';

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const categories: (ProductCategory | 'All')[] = ['All', 'Milk Tea', 'Fruit Tea', 'Coffee', 'Bakery', 'Snacks'];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let q = query(collection(db, 'products'), where('active', '==', true));
        if (activeCategory !== 'All') {
          q = query(q, where('category', '==', activeCategory));
        }
        const snapshot = await getDocs(q);
        let fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        if (searchQuery) {
          fetchedProducts = fetchedProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Sorting logic
        if (sortBy === 'price-asc') fetchedProducts.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') fetchedProducts.sort((a, b) => b.price - a.price);
        if (sortBy === 'name') fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));

        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        handleFirestoreError(err, OperationType.LIST, 'products');
      } finally {
        setTimeout(() => setLoading(false), 400); // Shorter artificial delay for smooth transition
      }
    }
    fetchProducts();
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 pb-24">
      <header className="mb-10 md:mb-16">
        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 lg:p-16 border border-bento-accent shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-150 pointer-events-none">
            <ShoppingCart className="w-64 h-64 text-bento-primary" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 md:gap-12">
            <div className="space-y-4 md:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-bento-bg rounded-full border border-bento-accent">
                <div className="w-1.5 h-1.5 rounded-full bg-bento-primary animate-pulse" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-bento-primary">Menu Chill Tea</span>
              </div>
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.8] mb-2 md:mb-4">THỰC <br/><span className="text-bento-primary italic">ĐƠN</span></h1>
              <p className="text-[10px] md:text-sm text-bento-text/40 max-w-sm font-medium leading-relaxed">
                Tất cả các món uống tại Chill Tea được pha chế từ nguyên liệu sạch, tươi mới mỗi ngày.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 md:gap-6 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-bento-text/20 group-focus-within:text-bento-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm món ngon..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full lg:w-96 pl-14 pr-6 py-4 md:py-5 bg-bento-bg rounded-2xl md:rounded-[2rem] font-sans focus:outline-none focus:ring-8 focus:ring-bento-primary/5 transition-all text-xs md:text-sm font-bold border border-transparent focus:border-bento-primary/20 placeholder:text-bento-text/10"
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start overflow-x-auto no-scrollbar py-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border shrink-0",
                      activeCategory === cat 
                        ? "bg-bento-primary text-white border-bento-primary shadow-lg shadow-bento-primary/20 scale-105" 
                        : "bg-white text-bento-text/40 border-bento-accent hover:border-bento-primary/30 hover:text-bento-primary active:scale-95"
                    )}
                  >
                    {cat === 'All' ? 'TẤT CẢ' : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 md:mt-12 pt-6 md:pt-8 border-t border-bento-accent/30 gap-4">
             <div className="flex items-center gap-4">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-bento-text/30">Hiển thị:</span>
                <div className="px-4 py-1.5 bg-bento-bg rounded-full border border-bento-accent">
                   <span className="text-[9px] md:text-[10px] font-black text-bento-primary">{products.length} Món ngon</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-3.5 md:w-4 h-3.5 md:h-4 text-bento-text/30" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none border-none py-1 cursor-pointer hover:text-bento-primary transition-colors appearance-none"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá (Thấp - Cao)</option>
                  <option value="price-desc">Giá (Cao - Thấp)</option>
                  <option value="name">Tên (A - Z)</option>
                </select>
                <ChevronDown className="w-3 h-3 text-bento-text/30 pointer-events-none" />
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <motion.div 
                key={`loading-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProductSkeleton />
              </motion.div>
            ))
          ) : products.length > 0 ? (
            products.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <ProductCard 
                  product={p} 
                  onOpenDetails={() => setSelectedProduct(p)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-40 text-center space-y-8 bg-white rounded-[4rem] border border-bento-accent border-dashed"
            >
              <div className="w-24 h-24 bg-bento-bg rounded-full flex items-center justify-center mx-auto text-bento-text/5 ring-8 ring-bento-bg/50">
                <Search className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Hết sạch vị này rồi bạn ơi</h3>
                <p className="text-bento-text/40 font-medium text-sm max-w-xs mx-auto leading-relaxed">
                  Trang trại vừa hết nguyên liệu cho món này, bạn thử tìm món khác "Chill" hơn nhé!
                </p>
              </div>
              <button 
                onClick={() => {setActiveCategory('All'); setSearchQuery('');}}
                className="px-8 py-3 bg-bento-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
              >
                Xem tất cả món
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}
