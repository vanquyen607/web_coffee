import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Package, Clock, 
  ChevronRight, ArrowLeft, Camera, Shield, LogOut, Award, Sparkles, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export function Profile() {
  const { user, profile, isAdmin, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    customerPhone: '',
    customerAddress: ''
  });
  const [adminStats, setAdminStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  // Derived stats
  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  
  const points = profile?.points || 0;
  const loyaltyTier = points >= 500 ? { name: 'Gold Member', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' } :
                     points >= 100 ? { name: 'Silver Member', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' } :
                     { name: 'Bronze Member', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (err) => {
      console.error("Orders listener error:", err);
      setLoading(false);
    });

    if (isAdmin) {
      const allOrdersQ = query(collection(db, 'orders'));
      const unsubscribeStats = onSnapshot(allOrdersQ, (snapshot) => {
        const all = snapshot.docs.map(d => d.data() as Order);
        setAdminStats({
          totalOrders: all.length,
          totalRevenue: all.reduce((sum, o) => o.status === 'completed' ? sum + o.total : sum, 0),
          pendingOrders: all.filter(o => o.status === 'pending').length
        });
      }, (err) => {
        console.warn("Admin stats restricted to authorized administrators", err);
      });
      return () => {
        unsubscribe();
        unsubscribeStats();
      }
    }

    return () => unsubscribe();
  }, [user, isAdmin]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        customerPhone: profile.customerPhone || '',
        customerAddress: profile.customerAddress || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', user.uid), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
      import('../components/ui/Toaster').then(({ toast }) => toast.success('Cập nhật hồ sơ thành công!'));
    } catch (err) {
      console.error(err);
      import('../components/ui/Toaster').then(({ toast }) => toast.error('Lỗi khi cập nhật hồ sơ'));
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Bạn chưa đăng nhập</h1>
        <p className="text-bento-text/40 font-medium">Vui lòng đăng nhập để xem lịch sử đơn hàng và quản lý tài khoản.</p>
        <Link to="/login" className="inline-block px-10 py-4 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Đăng nhập ngay</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-bento-text/40 hover:text-bento-primary transition-colors text-[10px] font-black uppercase tracking-widest">
             <ArrowLeft className="w-3 h-3" /> Chill Tea Vietnam
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.85]">TÀI KHOẢN <br/> <span className="text-bento-primary">CHILLER</span></h1>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="p-4 bg-white border border-bento-accent rounded-2xl hover:bg-bento-bg transition-colors shadow-sm"
            >
              <Camera className="w-5 h-5 text-bento-primary" />
            </button>
          </div>
        </div>
        <div className={cn("px-8 py-4 rounded-[2rem] border-2 flex items-center gap-4 shadow-sm", loyaltyTier.bg, loyaltyTier.border)}>
           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", loyaltyTier.bg, "border border-current opacity-20")}>
              <Award className={cn("w-6 h-6", loyaltyTier.color)} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loyalty Status</p>
              <p className={cn("text-xl font-black uppercase tracking-tighter", loyaltyTier.color)}>{loyaltyTier.name}</p>
           </div>
        </div>
      </header>

      {/* Points Progress */}
      <div className="bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 scale-110 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
            <Award className="w-48 h-48 text-bento-primary" />
         </div>
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Hành trình Chill</h3>
                  <p className="text-xs font-medium text-bento-text/40 italic">
                     {points >= 500 
                       ? "Bạn đã đạt cấp độ cao nhất! Tận hưởng mọi đặc quyền tại Chill Tea." 
                       : points >= 100 
                       ? `Bạn chỉ còn ${Math.max(0, 500 - points)} điểm nữa để đạt hạng Gold.` 
                       : `Tích lũy ${Math.max(0, 100 - points)} điểm nữa để lên hạng Silver.`}
                  </p>
               </div>
               <div className="px-5 py-2 bg-bento-bg rounded-full border border-bento-accent flex items-center gap-2">
                  <span className="text-[10px] font-black text-bento-primary">{points} / 500</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-bento-text/20">Points</span>
               </div>
            </div>

            <div className="relative h-4 w-full bg-bento-bg rounded-full p-1 overflow-hidden border border-bento-accent shadow-inner">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (points / 500) * 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-bento-primary to-bento-primary-dark shadow-[0_0_15px_rgba(72,132,109,0.3)] relative"
               >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-marquee" />
               </motion.div>
            </div>
            
            <div className="flex justify-between mt-4 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-bento-text/20">
               <span>Bronze</span>
               <span className="hidden md:block md:ml-[20%] text-bento-primary">Silver (100)</span>
               <span className="md:hidden">100 Pts</span>
               <span className="ml-auto">Gold (500)</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* User Stats Grid */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-bento-accent hover:shadow-xl transition-all group">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/30 mb-2">Đơn hàng hoàn tất</p>
              <div className="flex items-center gap-3">
                 <span className="text-4xl font-display font-black text-bento-text group-hover:text-green-500 transition-colors">{orders.filter(o => o.status === 'completed').length}</span>
                 <Package className="w-6 h-6 text-bento-accent" />
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-bento-accent hover:shadow-xl transition-all group">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/30 mb-2">Chi tiêu tích lũy</p>
              <div className="flex items-center gap-3">
                 <span className="text-4xl font-display font-black text-bento-text group-hover:text-amber-500 transition-colors">{(totalSpent / 1000).toFixed(0)}k</span>
                 <span className="text-[10px] font-black uppercase text-bento-text/20">VND</span>
              </div>
           </div>
           <div className="bg-bento-primary p-8 rounded-[2.5rem] border border-bento-primary text-white hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                 <Award className="w-12 h-12" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Chill Points</p>
              <div className="flex items-end gap-2">
                 <span className="text-4xl font-display font-black leading-none">{points}</span>
                 <span className="text-[10px] font-black uppercase opacity-40">Pts</span>
              </div>
           </div>
           <div className="bg-bento-bg p-8 rounded-[2.5rem] border border-bento-accent hover:shadow-xl transition-all group">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-bento-text/30 mb-2">Lời cảm ơn</p>
              <p className="text-xs font-medium text-bento-text/60 leading-tight">Cảm ơn bạn đã là một phần của Chill Tea.</p>
           </div>
        </div>

        {/* Member Benefits Section */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles className="w-48 h-48 text-bento-primary" />
           </div>
           <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                 <Award className="w-5 h-5 text-bento-primary" />
                 <h3 className="text-sm font-black uppercase tracking-widest">Đặc quyền người chơi hệ Chill</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className={cn("p-6 rounded-[2rem] border transition-all", points >= 500 ? "bg-amber-50 border-amber-200" : "bg-bento-bg border-bento-accent opacity-50")}>
                    <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-3">Gold Tier (500+ Pts)</p>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Giảm 15% tổng đơn</li>
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Miễn phí vận chuyển</li>
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Quà tặng sinh nhật</li>
                    </ul>
                 </div>
                 <div className={cn("p-6 rounded-[2rem] border transition-all", points >= 100 && points < 500 ? "bg-slate-50 border-slate-200" : points >= 500 ? "bg-slate-50 border-slate-200 opacity-50" : "bg-bento-bg border-bento-accent opacity-50")}>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Silver Tier (100+ Pts)</p>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Giảm 5% tổng đơn</li>
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Ưu tiên pha chế</li>
                    </ul>
                 </div>
                 <div className={cn("p-6 rounded-[2rem] border transition-all", points < 100 ? "bg-orange-50 border-orange-200" : "bg-orange-50 border-orange-200 opacity-50")}>
                    <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-3">Bronze Tier (0-99 Pts)</p>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Tích điểm Chill Points</li>
                       <li className="flex items-center gap-2 text-xs font-bold text-bento-text/60"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Thông báo ưu đãi</li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-bento-accent shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-bento-primary/10 rounded-full blur-[40px] -mr-16 -mt-16" />
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="relative group">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl" alt="Avatar" />
                ) : (
                  <div className="w-32 h-32 rounded-[2.5rem] bg-bento-bg border border-bento-accent flex items-center justify-center text-bento-primary/20">
                    <User className="w-16 h-16" />
                  </div>
                )}
                <button className="absolute bottom-2 right-2 p-3 bg-white rounded-xl shadow-lg border border-bento-accent text-bento-primary hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase leading-none">{profile?.displayName || 'Người dùng'}</h2>
                <div className="mt-3 flex items-center justify-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-bento-text/30">{profile?.role === 'admin' ? 'Quản trị viên' : 'Thành viên Chill Tea'}</p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-4 pt-6 border-t border-bento-bg">
                <p className="text-[8px] font-black uppercase tracking-widest text-bento-text/20 text-center">Lối tắt Admin</p>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 bg-bento-bg rounded-2xl border border-bento-accent text-center">
                      <p className="text-[8px] font-black uppercase text-bento-text/30 mb-1">Mục tiêu</p>
                      <p className="text-xs font-black text-bento-primary">{(adminStats.totalRevenue / 1000).toFixed(0)}k</p>
                   </div>
                   <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                      <p className="text-[8px] font-black uppercase text-rose-300 mb-1">Chờ Duyệt</p>
                      <p className="text-xs font-black text-rose-500">{adminStats.pendingOrders}</p>
                   </div>
                </div>
                <Link to="/admin" className="w-full flex items-center justify-center gap-3 py-4 bg-bento-text text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-bento-primary transition-all">
                  <Shield className="w-3.5 h-3.5 text-bento-accent" /> Dashboard
                </Link>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-bento-bg relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-bento-bg rounded-xl flex items-center justify-center text-bento-text/40">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-widest text-bento-text/20">Email</p>
                  <p className="text-[11px] font-bold truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-bento-bg rounded-xl flex items-center justify-center text-bento-text/40">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-bento-text/20">Hotline</p>
                  <p className="text-[11px] font-bold">{profile?.customerPhone || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            <button onClick={() => logout()} className="w-full flex items-center justify-center gap-3 py-5 bg-bento-bg text-bento-text/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* Orders */}
        <main className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[4rem] border border-bento-accent shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <div className="space-y-1">
                  <h3 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                    <Package className="w-5 h-5 text-bento-primary" />
                    Lịch sử Chill
                  </h3>
                  <p className="text-[9px] font-bold text-bento-text/30 uppercase tracking-[0.2em]">Danh sách các ly trà đã gắn bó với bạn</p>
               </div>
               <div className="flex items-center gap-1.5 px-4 py-2 bg-bento-bg rounded-full border border-bento-accent">
                 <span className="text-[10px] font-black text-bento-primary">{orders.length}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-bento-text/20">Đơn hàng</span>
               </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-bento-bg animate-pulse rounded-[2.5rem]" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-24 bg-bento-bg/20 rounded-[3rem] border-2 border-dashed border-bento-accent">
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-bento-accent rotate-12">
                  <Sparkles className="w-10 h-10 text-bento-accent" />
                </div>
                <h4 className="text-xl font-black tracking-tight uppercase mb-2">Chưa có vết tích Chill nào</h4>
                <Link to="/shop" className="inline-flex items-center gap-3 px-10 py-5 bg-bento-text text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] hover:bg-bento-primary transition-all">
                   Ghé cửa hàng Chill Tea <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="group p-8 bg-white rounded-[3rem] border border-bento-accent transition-all hover:shadow-2xl hover:border-bento-primary">
                    <div className="flex flex-col md:flex-row justify-between gap-10">
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-bento-bg rounded-xl border border-bento-accent">#{order.id.slice(-6).toUpperCase()}</span>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border flex items-center gap-2",
                                order.status === 'completed' ? "bg-green-50 text-green-600 border-green-100" : 
                                order.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {order.status === 'pending' ? 'Chờ xác nhận' : 
                                 order.status === 'processing' ? 'Đang pha chế' :
                                 order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                              </span>
                           </div>
                           <span className="text-[10px] font-black text-bento-text/20 uppercase tracking-widest">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : 'Gần đây'}</span>
                        </div>
                        
                        {order.status !== 'cancelled' && (
                          <div className="p-4 bg-bento-bg/30 rounded-2xl border border-bento-accent/50 space-y-3">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-bento-text/30">
                                <span>Chờ Duyệt</span>
                                <span>Pha Chế</span>
                                <span>Đã Giao</span>
                             </div>
                             <div className="h-1.5 w-full bg-white rounded-full overflow-hidden p-0.5 border border-white">
                                <div className={cn("h-full rounded-full transition-all duration-[2s]", 
                                  order.status === 'pending' ? 'w-1/3 bg-blue-400' : 
                                  order.status === 'processing' ? 'w-2/3 bg-amber-400' : 'w-full bg-green-500')} 
                                />
                             </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                           {order.items.map((item, i) => (
                             <div key={i} className="flex items-center gap-3 bg-white p-2.5 pr-5 rounded-2xl border border-bento-accent">
                                <div className="w-10 h-10 bg-bento-bg rounded-lg overflow-hidden shrink-0">
                                   <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black leading-tight line-clamp-1">{item.name}</p>
                                  <p className="text-[8px] font-black text-bento-primary">{item.quantity}x</p>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col justify-between items-end md:border-l border-bento-accent pt-6 md:pt-4 md:pl-10 min-w-[150px]">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-bento-text/20">Tổng chi phí</p>
                          <p className="text-3xl font-black text-bento-primary-dark tracking-tighter leading-none">{formatCurrency(order.total)}</p>
                        </div>
                        <button 
                           onClick={() => setSelectedOrder(order)}
                           className="inline-flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white px-6 py-3 bg-bento-text rounded-xl hover:bg-bento-primary transition-all"
                         >
                            Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </main>
       </div>

       {/* Edit Profile Modal */}
       <AnimatePresence>
         {isEditingProfile && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setIsEditingProfile(false)}
               className="absolute inset-0 bg-bento-text/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border border-bento-accent z-10"
             >
               <h2 className="text-3xl font-black tracking-tighter uppercase mb-10">Cập nhật hồ sơ</h2>
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Tên hiển thị</label>
                   <input 
                     value={editForm.displayName}
                     onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                     className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold border border-transparent focus:border-bento-primary/20 outline-none transition-all" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Số điện thoại</label>
                   <input 
                     value={editForm.customerPhone}
                     onChange={e => setEditForm({...editForm, customerPhone: e.target.value})}
                     className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold border border-transparent focus:border-bento-primary/20 outline-none transition-all" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-bento-text/30 pl-2">Địa chỉ giao hàng</label>
                   <textarea 
                     value={editForm.customerAddress}
                     onChange={e => setEditForm({...editForm, customerAddress: e.target.value})}
                     className="w-full px-8 py-4 bg-bento-bg rounded-2xl font-bold border border-transparent focus:border-bento-primary/20 outline-none transition-all min-h-[100px]" 
                   />
                 </div>
                 <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={() => setIsEditingProfile(false)}
                     className="flex-1 py-4 bg-bento-bg text-bento-text rounded-2xl font-black uppercase tracking-widest text-[10px]"
                   >
                     Hủy
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-4 bg-bento-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-bento-primary/20"
                   >
                     Lưu thay đổi
                   </button>
                 </div>
               </form>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Order Detail Modal */}
       <AnimatePresence>
         {selectedOrder && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setSelectedOrder(null)}
               className="absolute inset-0 bg-bento-text/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[3.5rem] p-10 lg:p-14 shadow-2xl relative border border-bento-accent z-10 scrollbar-none"
             >
               <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Chi tiết đơn hàng</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-text/30 mb-10">Mã đơn: #{selectedOrder.id.toUpperCase()}</p>
               
               <div className="space-y-8">
                 <div className="space-y-4">
                   {selectedOrder.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-bento-bg/30 p-5 rounded-3xl border border-bento-accent">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden border border-bento-accent shrink-0">
                           <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                         </div>
                         <div>
                           <p className="font-bold text-sm tracking-tight">{item.name}</p>
                           {item.options && (
                             <p className="text-[8px] font-black uppercase tracking-widest text-bento-text/30">
                               ĐƯỜNG: {item.options.sugar} | ĐÁ: {item.options.ice}
                             </p>
                           )}
                           <p className="text-[10px] font-black text-bento-primary">SL: {item.quantity}</p>
                         </div>
                       </div>
                       <p className="font-black text-bento-text">{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                   ))}
                 </div>

                 <div className="pt-6 border-t border-bento-bg space-y-3">
                   <div className="flex justify-between text-xs font-bold text-bento-text/40">
                     <span>Trạng thái:</span>
                     <span className="uppercase text-bento-primary">{selectedOrder.status}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-bento-text/40">
                     <span>Địa chỉ nhận hàng:</span>
                     <span className="text-right text-bento-text max-w-[200px]">{selectedOrder.customerAddress}</span>
                   </div>
                   <div className="flex justify-between text-2xl font-black tracking-tighter pt-4 border-t border-bento-bg">
                     <span>TỔNG CỘNG</span>
                     <span className="text-bento-primary-dark">{formatCurrency(selectedOrder.total)}</span>
                   </div>
                 </div>

                 <button 
                   onClick={() => setSelectedOrder(null)}
                   className="w-full py-5 bg-bento-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                 >
                   Đóng
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
