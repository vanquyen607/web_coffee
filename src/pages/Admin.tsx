import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, Package, ShoppingCart, 
  ChevronRight, ChevronUp, ChevronDown, CheckCircle, Clock, X, AlertCircle, TrendingUp, Info, PieChart as PieIcon, BarChart3, Star, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch,
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order, OrderStatus } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from '../components/ui/Toaster';
import { useAuth } from '../context/AuthContext';

export function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'coupons' | 'slides'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
 
     const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
     const unsubProducts = onSnapshot(qProducts, (snapshot) => {
       setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
     }, (err) => {
       handleFirestoreError(err, OperationType.LIST, 'products');
     });
 
     const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
     const unsubOrders = onSnapshot(qOrders, (snapshot) => {
       setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
       setLoading(false);
     }, (err) => {
       handleFirestoreError(err, OperationType.LIST, 'orders');
     });

     const qCoupons = query(collection(db, 'coupons'), orderBy('active', 'desc'));
     const unsubCoupons = onSnapshot(qCoupons, (snapshot) => {
       setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
     }, (err) => {
       handleFirestoreError(err, OperationType.LIST, 'coupons');
     });

     const qSlides = query(collection(db, 'slides'), orderBy('order', 'asc'));
     const unsubSlides = onSnapshot(qSlides, (snapshot) => {
       setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
     }, (err) => {
       handleFirestoreError(err, OperationType.LIST, 'slides');
     });
 
     return () => {
       unsubProducts();
       unsubOrders();
       unsubCoupons();
       unsubSlides();
     };
   }, [isAdmin]);
 
   const seedProducts = async (isAuto = false) => {
    const sampleProducts = [
      // Milk Tea
      { name: "Trà sữa Matcha Uji", price: 55000, category: "Milk Tea", description: "Bột Matcha từ vùng Uji Nhật Bản, kết hợp sữa béo ngậy và trân châu trắng.", image: "https://images.unsplash.com/photo-1594361844339-197b0bc37626?w=800", stock: 50, active: true, isPopular: true },
      { name: "Sữa Tươi Trân Châu Đường Đen", price: 52000, category: "Milk Tea", description: "Sữa tươi hữu cơ kết hợp trân châu thủ công nấu đường đen đậm đà ấm nóng.", image: "https://images.unsplash.com/photo-1544467316-e97029d2d483?w=800", stock: 120, active: true, isPopular: true },
      { name: "Trà Sữa Khoai Môn Tươi", price: 48000, category: "Milk Tea", description: "Cốt trà sữa thơm béo hòa quyện cùng mứt khoai môn tươi tự tay chế biến.", image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=800", stock: 80, active: true, isPopular: false },
      { name: "Trà Sữa Oolong Nướng", price: 45000, category: "Milk Tea", description: "Vị trà oolong được nướng nhẹ, tạo hậu vị khói đặc trưng và ngọt thanh.", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800", stock: 90, active: true, isPopular: true },
      { name: "Trà Sữa Hạt Dẻ", price: 49000, category: "Milk Tea", description: "Hương vị bùi béo của hạt dẻ hòa quyện trong lớp trà sữa mịn màng.", image: "https://images.unsplash.com/photo-1517701614591-6893619ca2f2?w=800", stock: 45, active: true, isPopular: false },
      
      // Coffee
      { name: "Cà phê Muối Biển Chill", price: 39000, category: "Coffee", description: "Cà phê phin Robusta đậm đà và lớp kem muối mặn béo đặc sản của quán.", image: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800", stock: 100, active: true, isPopular: true },
      { name: "Cold Brew Cam Vàng", price: 55000, category: "Coffee", description: "Cà phê ủ lạnh 18 tiếng kết hợp lát cam vàng và quế thơm nồng sảng khoái.", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", stock: 40, active: true, isPopular: false },
      { name: "Bạc Xỉu Sữa Hạnh Nhân", price: 42000, category: "Coffee", description: "Sự kết hợp hoàn hảo giữa espresso và sữa hạnh nhân cho người yêu sức khỏe.", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", stock: 60, active: true, isPopular: false },
      { name: "Caramel Macchiato", price: 59000, category: "Coffee", description: "Lớp sốt caramel ngọt ngào trên nền espresso và sữa nóng mượt mà.", image: "https://images.unsplash.com/photo-1485182708500-e8f1f318ba72?w=800", stock: 75, active: true, isPopular: true },
      { name: "Cà Phê Trứng Hà Nội", price: 45000, category: "Coffee", description: "Lớp kem trứng bông mịn mang hương vị truyền thống thủ đô.", image: "https://images.unsplash.com/photo-1497933322477-9110dc9bf96d?w=800", stock: 30, active: true, isPopular: true },
      
      // Fruit Tea
      { name: "Trà Đào Cam Sả", price: 45000, category: "Fruit Tea", description: "Trà đen thanh mát kết hợp đào miếng giòn tan, cam tươi và hương sả nồng nàn.", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800", stock: 80, active: true, isPopular: true },
      { name: "Trà Dâu Tây Đá Tuyết", price: 48000, category: "Fruit Tea", description: "Dâu tây Đà Lạt tươi xay nhuyễn cùng trà xanh, mát lạnh sảng khoái.", image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800", stock: 50, active: true, isPopular: false },
      { name: "Trà Vải Hoa Lài", price: 45000, category: "Fruit Tea", description: "Hương hoa lài thơm ngát kết hợp vải thiều mọng nước và thạch vải.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800", stock: 70, active: true, isPopular: true },
      { name: "Trà Thanh Long Đỏ", price: 42000, category: "Fruit Tea", description: "Màu sắc tự nhiên từ thanh long đỏ hòa quyện cùng trà chanh thanh mát.", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800", stock: 65, active: true, isPopular: false },
      { name: "Trà Xoài Nhiệt Đới", price: 49000, category: "Fruit Tea", description: "Xoài chín cây kết hợp cùng trà lài và thạch xoài dẻo.", image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=800", stock: 60, active: true, isPopular: true },
      
      // Bakery
      { name: "Croissant Bơ Pháp", price: 35000, category: "Bakery", description: "Bánh sừng bò ngàn lớp thơm lừng bơ Pháp cao cấp, vỏ giòn ruột mềm.", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800", stock: 40, active: true, isPopular: true },
      { name: "Tiramisu Modern Chef", price: 55000, category: "Bakery", description: "Cốt bánh thấm đẫm espresso kết hợp kem mascarpone mềm mịn như nhung.", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800", stock: 25, active: true, isPopular: true },
      { name: "Macaron Colorful Gift", price: 25000, category: "Bakery", description: "Bánh macaron nhỏ xinh với nhiều hương vị trái cây tự nhiên từ Pháp.", image: "https://images.unsplash.com/photo-1559181567-c3190cb9959b?w=800", stock: 100, active: true, isPopular: false },
      { name: "Red Velvet Cake", price: 49000, category: "Bakery", description: "Sắc đỏ nồng nàn cùng lớp kem cheese béo nhẹ, ngọt thanh.", image: "https://images.unsplash.com/photo-1586788680434-30d324634bf6?w=800", stock: 20, active: true, isPopular: false },
      { name: "Bánh Mì Garlic Cheese", price: 38000, category: "Bakery", description: "Bánh mì bơ tỏi phô mai tan chảy, thơm nồng quyến rũ.", image: "https://images.unsplash.com/photo-1586444248902-2f64eddf13cf?w=800", stock: 30, active: true, isPopular: true },
      
      // Snacks
      { name: "Khoai Tây Chiên Truffle", price: 49000, category: "Snacks", description: "Khoai tây chiên giòn rắc muối biển và tinh dầu nấm Truffle quý hiếm.", image: "https://images.unsplash.com/photo-1518013046770-410a040e3596?w=800", stock: 60, active: true, isPopular: true },
      { name: "Bánh Gấu Cocoa Nhật", price: 32000, category: "Snacks", description: "Bánh gấu nhỏ xinh với lớp vỏ cocoa đậm đà và nhân kem béo.", image: "https://images.unsplash.com/photo-1599596664593-9c84d7aee70c?w=800", stock: 200, active: true, isPopular: false },
      { name: "Bắp Rang Phô Mai", price: 29000, category: "Snacks", description: "Bắp rang giòn rụm bao phủ lớp phô mai Mỹ mặn mặn ngọt ngọt.", image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800", stock: 150, active: true, isPopular: false },
      { name: "Khô Gà Lá Chanh", price: 35000, category: "Snacks", description: "Thịt gà xé cay nồng thơm mùi lá chanh, ăn kèm trà sữa rất hợp.", image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=800", stock: 100, active: true, isPopular: true },
    ];

    if (!isAuto && !window.confirm(`Hệ thống sẽ đồng bộ ${sampleProducts.length} sản phẩm chuyên nghiệp. Tiếp tục?`)) return;

    try {
      toast.info('Đang khởi tạo dữ liệu mẫu...');
      const batch = writeBatch(db);
      
      sampleProducts.forEach(p => {
        const newDocRef = doc(collection(db, 'products'));
        batch.set(newDocRef, {
          ...p,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.success('Danh mục sản phẩm đã được khởi tạo thành công!');
    } catch (err) {
      console.error("Seed error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'products/seed');
    }
  };

  useEffect(() => {
    if (products.length === 0 && !loading) {
      const timer = setTimeout(() => {
        seedProducts(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [products.length, loading]);

  // Chart Data Preparation
  const revenueByCategoryItems = products.map(p => {
    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((acc, order) => {
        const item = order.items.find(i => i.productId === p.id);
        return acc + (item ? item.price * item.quantity : 0);
      }, 0);
    return { name: p.name, category: p.category, value: revenue };
  });

  const categoryTotals = Array.from(new Set(products.map(p => p.category))).map(cat => {
    const total = revenueByCategoryItems
      .filter(r => r.category === cat)
      .reduce((acc, curr) => acc + curr.value, 0);
    return { name: cat, value: total };
  }).filter(c => c.value > 0);

  // Advanced Stats Data Calculations
  const topSellingProducts = products
    .map(p => {
      const salesCount = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => {
          const item = order.items.find(i => i.productId === p.id);
          return sum + (item ? item.quantity : 0);
        }, 0);
      return { name: p.name, sales: salesCount };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const hourlyData = Array.from({ length: 24 }).map((_, hour) => {
    const count = orders.filter(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      return date && date.getHours() === hour;
    }).length;
    return { hour: `${hour}h`, orders: count };
  }).filter(d => d.orders > 0 || (Number(d.hour.replace('h','')) > 7 && Number(d.hour.replace('h','')) < 23));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (authLoading) return <div className="p-24 text-center">Đang kiểm tra quyền truy cập...</div>;
  if (!isAdmin) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-black mb-4">KHÔNG CÓ QUYỀN TRUY CẬP</h1>
      <p className="text-[#1a1a1a]/40 font-medium">Bạn cần quyền quản trị viên để xem trang này.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 font-sans overflow-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start md:items-center gap-8 bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-bento-accent shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bento-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="space-y-2 md:space-y-3 z-10">
          <p className="text-bento-primary font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">Quản trị hệ thống</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">DASHBOARD</h1>
        </div>
        
        <div className="flex bg-bento-bg p-1.5 rounded-[1.5rem] md:rounded-[2rem] border border-bento-accent z-10 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <div className="flex flex-nowrap lg:flex-wrap w-full min-w-max lg:min-w-0">
            {[
              { id: 'dashboard', label: 'Tổng quan', icon: <TrendingUp className="w-3 h-3 md:w-4 h-4" /> },
              { id: 'orders', label: 'Đơn hàng', icon: <ShoppingCart className="w-3 h-3 md:w-4 h-4" /> },
              { id: 'inventory', label: 'Kho hàng', icon: <Package className="w-3 h-3 md:w-4 h-4" /> },
              { id: 'slides', label: 'Slider', icon: <Info className="w-3 h-3 md:w-4 h-4" /> },
              { id: 'coupons', label: 'Promotion', icon: <Sparkles className="w-3 h-3 md:w-4 h-4" /> }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-2 md:gap-3 whitespace-nowrap",
                  activeTab === tab.id ? "bg-white text-bento-primary shadow-sm border border-bento-accent" : "text-bento-text/30 hover:text-bento-text"
                )}
              >
                {tab.icon}
                <span className={cn(activeTab === tab.id ? "block" : "hidden sm:block")}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: "Doanh thu", value: formatCurrency(orders.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.total : 0), 0)), icon: <TrendingUp className="w-4 h-4 md:w-5 h-5" />, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                  { label: "Đơn hàng", value: orders.filter(o => o.status === 'pending').length, icon: <Clock className="w-4 h-4 md:w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                  { label: "Sản phẩm", value: products.length, icon: <Package className="w-4 h-4 md:w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                  { label: "Khách", value: new Set(orders.map(o => o.customerId)).size, icon: <Info className="w-4 h-4 md:w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" }
                ].map((stat, i) => (
                  <div key={i} className={cn("p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border shadow-sm space-y-4 md:space-y-6 flex flex-col items-center text-center transition-all hover:scale-[1.02] bg-white", stat.border)}>
                    <div className={cn("w-10 h-10 md:w-14 h-14 rounded-xl md:rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1 md:mb-2">{stat.label}</p>
                      <p className={cn("text-lg md:text-3xl font-black tracking-tighter truncate w-full", stat.color)}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity Mini Tables or Charts could go here */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-bento-primary" />
                      Doanh thu theo danh mục
                    </h3>
                  </div>
                  <div className="h-[350px] w-full">
                    {categoryTotals.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryTotals}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#666' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#666' }} 
                            tickFormatter={(val) => `${val/1000}k`}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8f8f8' }}
                            contentStyle={{ borderRadius: '1rem', border: '1px solid #eee', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(val: number) => [formatCurrency(val), 'Doanh thu']}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {categoryTotals.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-bento-text/20 uppercase font-black text-xs tracking-widest">Chưa có dữ liệu doanh thu</div>
                    )}
                  </div>
                </section>

                <section className="bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                    <PieIcon className="w-4 h-4 text-bento-primary" />
                    Phân bổ sản phẩm
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryTotals.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid #eee', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                    <Star className="w-4 h-4 text-bento-primary" />
                    Top món bán chạy
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={topSellingProducts}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip />
                        <Bar dataKey="sales" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-bento-primary" />
                    Khung giờ đặt hàng
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <section className="bg-white p-10 rounded-[3rem] border border-bento-accent">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                       <ShoppingCart className="w-4 h-4 text-bento-primary" />
                       Đơn hàng gần đây
                    </h3>
                    <div className="space-y-4">
                       {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-4 bg-bento-bg/50 rounded-2xl border border-transparent hover:border-bento-accent transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-bento-accent flex items-center justify-center text-[10px] font-black">
                                   #{order.id.slice(-4).toUpperCase()}
                                </div>
                                <div>
                                   <p className="text-xs font-bold leading-none">{order.customerName}</p>
                                   <p className="text-[10px] text-bento-text/40">{formatCurrency(order.total)}</p>
                                </div>
                             </div>
                             <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-1 rounded-md",
                                order.status === 'pending' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                             )}>
                                {order.status}
                             </span>
                          </div>
                       ))}
                    </div>
                 </section>

                 <section className="bg-white p-10 rounded-[3rem] border border-bento-accent">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                       <Package className="w-4 h-4 text-bento-primary" />
                       Hàng sắp hết
                    </h3>
                    <div className="space-y-4">
                       {products.sort((a,b) => a.stock - b.stock).slice(0, 5).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-bento-bg/50 rounded-2xl border border-transparent hover:border-bento-accent transition-all">
                             <div className="flex items-center gap-4">
                                <img src={p.image} className="w-10 h-10 rounded-xl object-cover border border-bento-accent" alt={p.name} />
                                <div>
                                   <p className="text-xs font-bold leading-none">{p.name}</p>
                                   <p className="text-[10px] text-bento-text/40">{p.category}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={cn("text-xs font-black", p.stock < 10 ? "text-red-500" : "text-bento-text")}>
                                   {p.stock} <span className="text-[8px] opacity-40">ITEM</span>
                                </p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <OrderManager key="orders" orders={orders} />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager 
              key="inventory" 
              products={products} 
              onAdd={() => setIsAddingProduct(true)}
              onEdit={(p) => setEditingProduct(p)}
              onSeed={() => seedProducts()}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponManager coupons={coupons} />
          )}

          {activeTab === 'slides' && (
            <SlideManager slides={slides} />
          )}
        </AnimatePresence>
      </main>

      {(isAddingProduct || editingProduct) && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => {
            setIsAddingProduct(false);
            setEditingProduct(null);
          }} 
        />
      )}
    </div>
  );
}

function SlideManager({ slides }: { slides: any[] }) {
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);

  const deleteSlide = async (id: string) => {
    if (!window.confirm('Xóa slide này?')) return;
    try {
      await deleteDoc(doc(db, 'slides', id));
      toast.success('Đã xóa slide');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `slides/${id}`);
    }
  };

  const moveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'slides', currentSlide.id), { 
        order: targetSlide.order, 
        updatedAt: serverTimestamp() 
      });
      batch.update(doc(db, 'slides', targetSlide.id), { 
        order: currentSlide.order, 
        updatedAt: serverTimestamp() 
      });
      await batch.commit();
      toast.success('Đã cập nhật thứ tự');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'slides/reorder');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-bento-accent shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest">Quản lý Slider</h3>
          <p className="text-[10px] text-bento-text/30 font-bold uppercase tracking-widest">Thay đổi hình ảnh và nội dung banner trang chủ</p>
        </div>
        <button 
          onClick={() => setIsAddingSlide(true)}
          className="px-8 py-4 bg-bento-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-bento-primary/20 hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Thêm slide mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-white rounded-[2.5rem] border border-bento-accent overflow-hidden shadow-sm hover:shadow-xl transition-all group p-4">
             <div className="aspect-[21/9] rounded-[2rem] overflow-hidden mb-6 relative">
                <img src={slide.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={slide.title} />
                <div className="absolute top-4 right-4 flex gap-2">
                   <button onClick={() => setEditingSlide(slide)} className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-bento-primary hover:bg-white shadow-lg transition-all" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => deleteSlide(slide.id)} className="p-3 bg-rose-500/90 backdrop-blur-md rounded-xl text-white hover:bg-rose-600 shadow-lg transition-all" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                   <button 
                    onClick={() => moveSlide(index, 'up')}
                    disabled={index === 0}
                    className="p-3 bg-black/50 backdrop-blur-md rounded-xl text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Di chuyển lên"
                   >
                      <ChevronUp className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => moveSlide(index, 'down')}
                    disabled={index === slides.length - 1}
                    className="p-3 bg-black/50 backdrop-blur-md rounded-xl text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Di chuyển xuống"
                   >
                      <ChevronDown className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute bottom-4 left-4">
                   <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest">Vị trí: {slide.order}</span>
                </div>
             </div>
             <div className="px-4 pb-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-bento-primary">{slide.feature || 'NO FEATURE TEXT'}</p>
                <h4 className="text-xl font-black tracking-tighter uppercase">{slide.title}</h4>
                <p className="text-sm font-display italic text-bento-text/60">{slide.subtitle}</p>
                <p className="text-xs text-bento-text/40 line-clamp-2 leading-relaxed">{slide.description}</p>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(isAddingSlide || editingSlide) && (
          <SlideModal 
            slide={editingSlide} 
            onClose={() => {
              setIsAddingSlide(false);
              setEditingSlide(null);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideModal({ slide, onClose }: { slide?: any, onClose: () => void }) {
  const isEditing = !!slide;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      image: formData.get('image')?.toString() || '',
      title: formData.get('title')?.toString() || '',
      subtitle: formData.get('subtitle')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      feature: formData.get('feature')?.toString() || '',
      order: Number(formData.get('order')) || 0,
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'slides', slide.id), { ...data, updatedAt: serverTimestamp() });
        toast.success('Cập nhật slide thành công!');
      } else {
        await addDoc(collection(db, 'slides'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast.success('Thêm slide thành công!');
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, isEditing ? `slides/${slide.id}` : 'slides');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-bento-text/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative border border-bento-accent max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <button onClick={onClose} className="absolute top-10 right-10 p-3 hover:bg-bento-bg rounded-2xl transition-all">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">{isEditing ? 'CHỈNH SỬA SLIDE' : 'THÊM SLIDE MỚI'}</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">URL Hình ảnh</label>
            <input 
              name="image" 
              defaultValue={slide?.image} 
              required 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none" 
              placeholder="https://images.unsplash.com/..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Tiêu đề chính</label>
            <input 
              name="title" 
              defaultValue={slide?.title} 
              required 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none" 
              placeholder="VD: TRÀ SỮA" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Tiêu đề phụ (Italic)</label>
            <input 
              name="subtitle" 
              defaultValue={slide?.subtitle} 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none" 
              placeholder="VD: ĐẬM VỊ NGUYÊN BẢN" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Thứ tự hiển thị</label>
            <input 
              name="order" 
              type="number" 
              defaultValue={slide?.order || 0} 
              required 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Feature Tag</label>
            <input 
              name="feature" 
              defaultValue={slide?.feature} 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none" 
              placeholder="VD: Best Seller" 
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Mô tả chi tiết</label>
            <textarea 
              name="description" 
              defaultValue={slide?.description} 
              rows={3} 
              className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs border border-transparent focus:border-bento-primary/20 outline-none resize-none" 
              placeholder="Giới thiệu ngắn về slide này..."
            />
          </div>

          <div className="md:col-span-2 pt-4">
             <button type="submit" className="w-full py-6 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:brightness-110 transition-all active:scale-95">
                {isEditing ? 'Cập nhật thay đổi' : 'Xác nhận thêm slide'}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OrderManager({ orders }: { orders: Order[], key?: string }) {
  const updateStatus = async (order: Order, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status, updatedAt: serverTimestamp() });
      
      // Award loyalty points on completion
      if (status === 'completed' && order.customerId) {
        const pointsEarned = Math.floor(order.total / 10000);
        if (pointsEarned > 0) {
          const userRef = doc(db, 'users', order.customerId);
          try {
            await updateDoc(userRef, {
              points: increment(pointsEarned),
              updatedAt: serverTimestamp()
            });
            toast.success(`Đã cộng thêm ${pointsEarned} điểm tích lũy cho khách hàng!`);
          } catch (userErr) {
            console.error("Error awarding points:", userErr);
            // Don't fail the whole operation if points assignment fails
          }
        }
      }

      toast.success('Cập nhật trạng thái thành công!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="overflow-x-auto rounded-[2rem] md:rounded-[2.5rem] border border-bento-accent bg-white shadow-sm no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
          <thead>
            <tr className="bg-bento-bg/30 border-b border-bento-accent">
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Mã đơn</th>
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Khách hàng</th>
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Chi tiết</th>
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Tổng cộng</th>
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30">Trạng thái</th>
              <th className="px-8 py-6 text-[9px] font-bold uppercase tracking-widest text-bento-text/30 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-bento-accent hover:bg-bento-bg/10 transition-colors">
                <td className="px-8 py-6 font-bold text-xs">#{order.id.slice(-6).toUpperCase()}</td>
                <td className="px-8 py-6">
                  <p className="font-bold text-sm tracking-tight">{order.customerName}</p>
                  <p className="text-[10px] text-bento-text/40">{order.customerPhone}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[11px] font-bold text-bento-text/70">{item.quantity}x {item.name}</span>
                        {item.options && (
                          <span className="text-[8px] font-black uppercase text-bento-text/30 tracking-widest pl-2">
                             S: {item.options.sugar} | I: {item.options.ice}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6 font-black text-bento-primary text-sm">{formatCurrency(order.total)}</td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] uppercase font-bold tracking-widest",
                    order.status === 'pending' && "bg-[#E4F4FF] text-blue-600 border border-[#BDE3FF]",
                    order.status === 'processing' && "bg-[#FFF4E4] text-orange-600 border border-[#FFDBBC]",
                    order.status === 'completed' && "bg-[#E4FFE4] text-green-600 border border-[#BCFFBD]",
                    order.status === 'cancelled' && "bg-[#FFE4E4] text-red-600 border border-[#FFBDBC]"
                  )}>
                    {order.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex gap-2 justify-center">
                    {order.status === 'pending' && (
                        <button onClick={() => updateStatus(order, 'processing')} className="p-2.5 bg-white border border-bento-accent text-orange-400 rounded-xl hover:bg-orange-50 transition-all"><Clock className="w-4 h-4" /></button>
                    )}
                    {order.status === 'processing' && (
                        <button onClick={() => updateStatus(order, 'completed')} className="p-2.5 bg-white border border-bento-accent text-green-500 rounded-xl hover:bg-green-50 transition-all"><CheckCircle className="w-4 h-4" /></button>
                    )}
                    {['pending', 'processing'].includes(order.status) && (
                        <button onClick={() => updateStatus(order, 'cancelled')} className="p-2.5 bg-white border border-bento-accent text-red-400 rounded-xl hover:bg-red-50 transition-all"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function CouponManager({ coupons }: { coupons: any[] }) {
  const [isAdding, setIsAdding] = useState(false);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { active: !current });
      toast.success('Cập nhật trạng thái thành công!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupons/${id}`);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Xóa mã giảm giá này?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Đã xóa mã giảm giá');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-bento-accent shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest">Quản lý mã giảm giá</h3>
          <p className="text-[10px] text-bento-text/30 font-bold uppercase tracking-widest">Tạo các chương trình ưu đãi cho khách hàng</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-4 bg-bento-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-bento-primary/20 hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Tạo mã mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={cn(
             "p-8 rounded-[2.5rem] border bg-white shadow-sm space-y-6 relative overflow-hidden transition-all hover:shadow-xl",
             !coupon.active && "opacity-60 grayscale"
          )}>
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <span className="px-3 py-1 bg-bento-bg rounded-lg text-[10px] font-black uppercase tracking-widest text-bento-primary border border-bento-accent">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${formatCurrency(coupon.discountValue)} OFF`}
                   </span>
                   <h4 className="text-2xl font-black tracking-tighter uppercase">{coupon.code}</h4>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => toggleActive(coupon.id, coupon.active)} className="p-2.5 bg-bento-bg rounded-xl text-bento-text/30 hover:text-bento-primary transition-all">
                      <Info className="w-4 h-4" />
                   </button>
                   <button onClick={() => deleteCoupon(coupon.id)} className="p-2.5 bg-rose-50 rounded-xl text-rose-300 hover:text-rose-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>
             
             <div className="space-y-3 pt-4 border-t border-bento-bg">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-bento-text/30">
                   <span>Đơn tối thiểu:</span>
                   <span className="text-bento-text">{formatCurrency(coupon.minOrderValue || 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-bento-text/30">
                   <span>Trạng thái:</span>
                   <span className={cn(coupon.active ? "text-green-500" : "text-rose-500")}>{coupon.active ? "ĐANG HOẠT ĐỘNG" : "ĐÃ TẮT"}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bento-text/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border border-bento-accent"
          >
            <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 p-3 hover:bg-bento-bg rounded-2xl">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-8">TẠO MÃ GIẢM GIÁ</h2>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              try {
                await addDoc(collection(db, 'coupons'), {
                  code: data.get('code')?.toString().toUpperCase(),
                  discountType: data.get('discountType'),
                  discountValue: Number(data.get('discountValue')),
                  minOrderValue: Number(data.get('minOrderValue')),
                  active: true,
                  createdAt: serverTimestamp()
                });
                toast.success('Tạo mã thành công!');
                setIsAdding(false);
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, 'coupons');
              }
            }}>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Mã Khuyến Mãi</label>
                <input name="code" required className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold uppercase tracking-widest text-xs border border-transparent focus:border-bento-primary/20 outline-none" placeholder="VD: CHILL2024" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Loại chiết khấu</label>
                   <select name="discountType" className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs outline-none">
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (₫)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Giá trị</label>
                    <input name="discountValue" type="number" required className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs outline-none" placeholder="0" />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Đơn hàng tối thiểu (₫)</label>
                <input name="minOrderValue" type="number" defaultValue="0" className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold text-xs outline-none" placeholder="0" />
              </div>
              <button type="submit" className="w-full py-5 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:brightness-110">
                Lưu mã giảm giá
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function InventoryManager({ products, onAdd, onEdit, onSeed }: { products: Product[], onAdd: () => void, onEdit: (p: Product) => void, onSeed: () => void, key?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleActive = async (p: Product) => {
    try {
      await updateDoc(doc(db, 'products', p.id), { active: !p.active, updatedAt: serverTimestamp() });
      toast.success(`${p.active ? 'Ẩn' : 'Hiện'} sản phẩm thành công!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm: ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Sản phẩm đã được xóa khỏi hệ thống!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-bento-accent shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/20 group-focus-within:text-bento-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm hoặc danh mục..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-bento-bg/50 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-bento-primary/5 transition-all border border-transparent focus:border-bento-primary/20" 
            />
          </div>
          <div className="flex gap-4">
             <button 
               onClick={onSeed} 
               className="group relative px-8 py-5 bg-white text-bento-primary hover:bg-bento-primary hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-bento-primary/20 shadow-sm active:scale-95 flex items-center gap-2 overflow-hidden"
             >
               <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
               Dữ liệu mẫu
               <div className="absolute inset-0 bg-bento-primary/5 group-hover:bg-transparent pointer-events-none" />
             </button>
             <div className="flex items-center px-8 py-5 bg-bento-bg/30 border border-bento-accent rounded-2xl">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mr-3">Phân loại:</span>
                 <span className="text-sm font-black text-bento-primary">{products.length}</span>
             </div>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="w-full md:w-auto px-10 py-5 bg-bento-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-bento-primary/20 hover:brightness-110 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Đăng sản phẩm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
        {filteredProducts.map((p) => (
          <div key={p.id} className={cn(
            "p-6 rounded-[2.5rem] border shadow-sm flex gap-6 group hover:shadow-xl transition-all duration-500 overflow-hidden relative",
            p.stock < 10 ? "border-rose-500 bg-rose-50/50 shadow-rose-100" : "bg-white border-bento-accent"
          )}>
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-bento-bg border border-bento-accent shrink-0 relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              {p.isPopular && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-white p-1.5 rounded-lg shadow-lg">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-black text-bento-text text-sm tracking-tight leading-tight line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] uppercase font-black text-bento-primary tracking-[0.2em] px-2 py-1 bg-bento-primary/5 rounded-md border border-bento-primary/10">{p.category}</span>
                  </div>
                </div>
                {!p.active && <span className="px-2 py-1 bg-rose-50 text-rose-500 text-[8px] uppercase font-black rounded-lg border border-rose-100">Đã ẩn</span>}
              </div>
              
                 <div className="flex justify-between items-end">
                <div>
                  <p className="font-black text-bento-primary text-base">{formatCurrency(p.price)}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", p.stock < 10 ? "bg-rose-500 animate-pulse" : "bg-green-500")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", p.stock < 10 ? "text-rose-500" : "text-bento-text/40")}>
                      KHO: {p.stock}
                      {p.stock < 10 && " - SẮP HẾT!"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(p)} 
                    className="p-3.5 text-bento-text/40 hover:text-bento-primary hover:bg-bento-bg rounded-xl transition-all active:scale-95 bg-bento-bg/30"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleActive(p)} 
                    className={cn(
                      "p-3.5 rounded-xl transition-all active:scale-95",
                      p.active ? "text-bento-text/40 hover:text-blue-500 hover:bg-blue-50 bg-bento-bg/30" : "text-rose-500 bg-rose-50 border border-rose-100"
                    )}
                    title={p.active ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteProduct(p.id, p.name)} 
                    className="p-3.5 text-bento-text/40 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95 bg-bento-bg/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProductModal({ product, onClose }: { product: Product | null, onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    category: product?.category || 'Milk Tea',
    description: product?.description || '',
    image: product?.image || '',
    stock: product?.stock || 0,
    active: product?.active ?? true,
    isPopular: product?.isPopular ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        updatedAt: serverTimestamp(),
      };

      if (product) {
        await updateDoc(doc(db, 'products', product.id), dataToSave);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast.success('Thêm sản phẩm mới thành công!');
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, product ? OperationType.UPDATE : OperationType.CREATE, product ? `products/${product.id}` : 'products');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bento-text/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] p-12 overflow-y-auto max-h-[90vh] shadow-2xl relative border border-bento-accent"
      >
        <button onClick={onClose} className="absolute top-10 right-10 p-3 hover:bg-bento-bg rounded-2xl transition-all border border-transparent hover:border-bento-accent">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-10 text-bento-primary-dark">
          {product ? 'CẬP NHẬT SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
             <div className="w-full md:w-40 h-40 bg-bento-bg rounded-[2rem] border-2 border-dashed border-bento-accent flex items-center justify-center overflow-hidden shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Info className="w-8 h-8 text-bento-text/10" />
                )}
             </div>
             <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Hình ảnh sản phẩm (URL)</label>
                  <input required value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-xs font-bold font-sans" placeholder="https://..." />
                </div>
                <div className="flex gap-4 items-center p-4 bg-bento-bg/30 rounded-2xl border border-bento-accent">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 accent-bento-primary rounded-lg" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Hiển thị</span>
                  </label>
                  <div className="w-px h-4 bg-bento-accent" />
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({...formData, isPopular: e.target.checked})} className="w-4 h-4 accent-bento-primary rounded-lg" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Nổi bật</span>
                  </label>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Tên sản phẩm</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-bold font-sans" placeholder="Tên sản phẩm..." />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Giá niêm yết (₫)</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-bold font-sans" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Danh mục</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-black uppercase tracking-widest font-sans">
                {['Milk Tea', 'Fruit Tea', 'Coffee', 'Bakery', 'Snacks'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Tồn kho hiện tại</label>
              <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-bold font-sans" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Mô tả chi tiết sản phẩm</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-8 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-sans min-h-[120px] leading-relaxed" placeholder="Ghi chú về nguyên liệu, hương vị đặc trưng..." />
          </div>
          <button type="submit" className="w-full py-6 bg-bento-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:shadow-xl hover:brightness-110 transition-all">
            {product ? 'LƯU THAY ĐỔI' : 'ĐĂNG BÁN SẢN PHẨM'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
