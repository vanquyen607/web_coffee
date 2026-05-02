import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, CheckCircle2, User, Phone, MapPin, Mail, Truck, AlertCircle, Ticket, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from '../components/ui/Toaster';
import { Link } from 'react-router-dom';
import { Coupon } from '../types';

export function Checkout() {
  const { items, total, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const finalTotal = Math.max(0, total - discount);

  // Membership Discount Calculation
  const membershipDiscount = profile?.points && profile.points >= 500 ? total * 0.15 : 
                           profile?.points && profile.points >= 100 ? total * 0.05 : 0;
  
  const totalWithMembership = finalTotal - membershipDiscount;
  const grandTotal = Math.max(0, totalWithMembership + 15000);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', promoCode.toUpperCase()), where('active', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error("Mã giảm giá không tồn tại hoặc đã hết hạn!");
        setDiscount(0);
        setAppliedCoupon(null);
        return;
      }

      const couponData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
      
      if (couponData.minOrderValue && total < couponData.minOrderValue) {
        toast.error(`Đơn hàng tối thiểu để dùng mã này là ${formatCurrency(couponData.minOrderValue)}`);
        return;
      }

      let discValue = 0;
      if (couponData.discountType === 'percentage') {
        discValue = (total * couponData.discountValue) / 100;
      } else {
        discValue = couponData.discountValue;
      }

      setDiscount(discValue);
      setAppliedCoupon(couponData);
      toast.success("Áp dụng mã giảm giá thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi áp dụng mã giảm giá.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const [formData, setFormData] = useState({
    name: profile?.displayName || '',
    phone: profile?.customerPhone || '',
    email: profile?.email || '',
    address: profile?.customerAddress || '',
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      toast.error('Tài khoản quản trị viên không được phép đặt hàng thực tế.');
      return;
    }
    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt hàng!');
      return;
    }
    if (items.length === 0) return;

    setIsPlacing(true);
    try {
      const orderData = {
        customerId: user.uid,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        items,
        total: grandTotal,
        discount: discount + membershipDiscount,
        couponCode: appliedCoupon?.code || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        
        // Update inventory (simplified)
        for (const item of items) {
          const productRef = doc(db, 'products', item.productId);
          try {
            await updateDoc(productRef, {
              stock: increment(-item.quantity)
            });
          } catch (updateErr) {
            handleFirestoreError(updateErr, OperationType.UPDATE, `products/${item.productId}`);
          }
        }

        setOrderSuccess(docRef.id);
        clearCart();
        toast.success('Đặt hàng thành công!');
      } catch (addErr: any) {
        if (addErr.message && addErr.message.startsWith('{')) throw addErr;
        handleFirestoreError(addErr, OperationType.CREATE, 'orders');
      }
    } catch (err: any) {
      console.error(err);
      try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.error.includes('Insufficient permissions')) {
          toast.error('Lỗi phân quyền: Không thể đặt hàng. Vui lòng liên hệ hỗ trợ.');
        } else {
          toast.error('Có lỗi xảy ra khi đặt hàng.');
        }
      } catch {
        toast.error('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
      }
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tighter">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="text-xl text-[#1a1a1a]/60 font-medium">Cảm ơn bạn đã tin tưởng Chill Tea. Mã đơn hàng của bạn là <span className="font-bold text-[#1a1a1a]">{orderSuccess.slice(-6).toUpperCase()}</span>.</p>
        </div>
        <div className="pt-8 flex flex-col gap-4">
          <Link to="/shop" className="px-10 py-5 bg-[#1a1a1a] text-white rounded-[24px] font-bold uppercase tracking-widest text-sm hover:bg-[#1a1a1a]/80 transition-colors">
            Tiếp tục mua sắm
          </Link>
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-all">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (itemCount === 0 && step === 1) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-8">
        <div className="w-24 h-24 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center mx-auto text-[#1a1a1a]/20">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tighter">GIỎ HÀNG TRỐNG</h1>
          <p className="text-[#1a1a1a]/40 font-medium text-lg">Có vẻ như bạn chưa thêm món nào vào giỏ hàng cả.</p>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-3 px-10 py-5 bg-[#1a1a1a] text-white rounded-[24px] font-bold uppercase tracking-widest text-sm hover:bg-[#1a1a1a]/80 transition-all">
          Đi đến cửa hàng ngay
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {isAdmin && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex items-center gap-6 text-amber-800">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
             <AlertCircle className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm font-black uppercase tracking-tight">Chế độ quản trị viên</p>
             <p className="text-xs font-medium opacity-70 italic">Bạn đang xem giỏ hàng với tư cách quản trị viên. Tính năng đặt hàng sẽ bị vô hiệu hóa để tránh tạo đơn ảo.</p>
           </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Steps/Form */}
        <div className="flex-1 space-y-6 md:space-y-8">
          <div className="flex items-center gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-bento-accent shadow-sm inline-flex mb-2 md:mb-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-xs font-black transition-all",
                step >= 1 ? "bg-bento-primary text-white shadow-lg shadow-bento-primary/20" : "bg-bento-bg text-bento-text/20"
              )}>01</div>
              <span className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest", step === 1 ? "text-bento-primary" : "text-bento-text/20")}>Giỏ hàng</span>
            </div>
            <div className="h-px w-4 md:w-8 bg-bento-accent/50" />
            <div className="flex items-center gap-2 md:gap-3">
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-xs font-black transition-all",
                step >= 2 ? "bg-bento-primary text-white shadow-lg shadow-bento-primary/20" : "bg-bento-bg text-bento-text/20"
              )}>02</div>
              <span className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest", step === 2 ? "text-bento-primary" : "text-bento-text/20")}>Giao hàng</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step-1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter">XÁC NHẬN GIỎ HÀNG</h1>
                <div className="space-y-3 md:space-y-4">
                  {items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="flex gap-3 md:gap-6 p-3 md:p-4 bg-white rounded-[1.5rem] md:rounded-[2rem] border border-bento-accent items-center shadow-sm">
                      <div className="flex-1 py-1 px-2 md:px-4">
                        <h3 className="text-xs md:text-base font-bold tracking-tight">{item.name}</h3>
                        {item.options && (
                          <div className="space-y-0.5 mt-1">
                            {(item.options.sugar || item.options.ice) && (
                              <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-bento-text/30 flex gap-2">
                                {item.options.sugar && <span>S: {item.options.sugar}</span>}
                                {item.options.sugar && item.options.ice && <span>|</span>}
                                {item.options.ice && <span>I: {item.options.ice}</span>}
                              </p>
                            )}
                            {item.options.note && (
                              <p className="text-[7px] md:text-[9px] font-bold text-bento-primary/60 italic truncate max-w-[150px] md:max-w-[300px]">
                                "{item.options.note}"
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-bento-primary font-bold text-xs md:text-sm">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 bg-bento-bg rounded-lg md:rounded-xl p-0.5 md:p-1 self-center">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.options)}
                          className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-md md:rounded-lg transition-all"
                        >
                          <Minus className="w-2 md:w-3 h-2 md:h-3" />
                        </button>
                        <span className="w-4 md:w-6 text-center font-bold text-[10px] md:text-xs">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.options)}
                          className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center hover:bg-white rounded-md md:rounded-lg transition-all"
                        >
                          <Plus className="w-2 md:w-3 h-2 md:h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.productId, item.options)}
                        className="p-2 md:p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-bento-primary text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-md mt-8"
                >
                  Thông tin thanh toán
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="step-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(1)} className="p-2.5 md:p-3 bg-white border border-bento-accent rounded-xl hover:bg-bento-accent/10 transition-all shadow-sm">
                    <ArrowRight className="w-3 md:w-4 h-3 md:h-4 rotate-180" />
                  </button>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Giao hàng</h1>
                </div>

                <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-bento-accent shadow-sm">
                  <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Họ và tên</label>
                    <div className="relative">
                      <User className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-3.5 md:w-4 h-3.5 md:h-4 text-bento-text/20" />
                      <input 
                        required
                        type="text" 
                        placeholder="Tên của bạn"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 md:pl-14 pr-6 py-3.5 md:py-4 bg-bento-bg/50 rounded-xl md:rounded-2xl font-sans focus:outline-none focus:ring-4 focus:ring-bento-primary/10 border-2 border-transparent focus:border-bento-primary/20 text-xs md:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-3.5 md:w-4 h-3.5 md:h-4 text-bento-text/20" />
                      <input 
                        required
                        type="tel" 
                        placeholder="Số điện thoại"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 md:pl-14 pr-6 py-3.5 md:py-4 bg-bento-bg/50 rounded-xl md:rounded-2xl font-sans focus:outline-none focus:ring-4 focus:ring-bento-primary/10 border-2 border-transparent focus:border-bento-primary/20 text-xs md:text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:space-y-2 col-span-2">
                    <label className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Địa chỉ giao hàng</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-3.5 md:w-4 h-3.5 md:h-4 text-bento-text/20" />
                      <input 
                        required
                        type="text" 
                        placeholder="Địa chỉ cụ thể"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-4 bg-bento-bg/50 rounded-xl md:rounded-2xl font-sans focus:outline-none focus:ring-4 focus:ring-bento-primary/10 border-2 border-transparent focus:border-bento-primary/20 text-xs md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 pt-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-bento-primary" />
                      Thanh toán
                    </h3>
                    <div className="p-5 border-2 border-bento-primary rounded-2xl bg-bento-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-4 border-bento-primary rounded-full" />
                        <span className="font-bold text-sm">Tiền mặt (COD)</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-40">Mặc định</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isPlacing}
                    className="col-span-2 mt-4 py-5 bg-bento-primary text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isPlacing ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Summary Card */}
        <div className="lg:w-96 space-y-8">
          <div className="p-8 bg-white border border-bento-accent rounded-[2.5rem] shadow-sm space-y-6">
            <h2 className="text-xl font-black tracking-tighter uppercase text-bento-primary-dark">Mã giảm giá</h2>
            <div className="flex gap-4">
              <input 
                 value={promoCode}
                 onChange={(e) => setPromoCode(e.target.value)}
                 placeholder="Nhập mã"
                 className="flex-1 bg-bento-bg border border-bento-accent rounded-2xl px-4 py-3 text-[10px] font-bold focus:outline-none focus:ring-4 focus:ring-bento-primary/5 transition-all uppercase"
              />
              <button 
                 onClick={applyPromoCode}
                 disabled={validatingCoupon || !promoCode.trim()}
                 className="px-6 bg-bento-text text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-bento-primary transition-all disabled:opacity-50"
              >
                {validatingCoupon ? "..." : "Áp dụng"}
              </button>
            </div>
            {appliedCoupon && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-bento-primary text-white rounded-[2rem] flex justify-between items-center shadow-xl shadow-bento-primary/20 relative overflow-hidden"
              >
                <div className="relative z-10">
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Đã áp dụng</span>
                   <p className="text-lg font-black tracking-tighter uppercase leading-none mt-1">{appliedCoupon.code}</p>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-[10px] font-black tracking-tighter">-{formatCurrency(discount)}</p>
                   <button onClick={() => { setAppliedCoupon(null); setDiscount(0); setPromoCode(''); }} className="text-[8px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mt-1">Gỡ bỏ</button>
                </div>
                <Sparkles className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 opacity-10 pointer-events-none" />
              </motion.div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-bento-accent shadow-sm sticky top-32">
            <h2 className="text-xl font-black tracking-tighter mb-8 uppercase text-bento-primary-dark">Tạm tính</h2>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex justify-between items-start bg-bento-bg/30 p-3 rounded-xl">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-xs leading-tight">{item.name}</p>
                    {item.options && (
                       <div className="space-y-0.5 mt-1">
                         {(item.options.sugar || item.options.ice) && (
                           <p className="text-[7px] font-black uppercase text-bento-text/30">
                             {item.options.sugar && `S: ${item.options.sugar}`}
                             {item.options.sugar && item.options.ice && ' | '}
                             {item.options.ice && `I: ${item.options.ice}`}
                           </p>
                         )}
                         {item.options.note && (
                           <p className="text-[7px] font-bold text-bento-primary/60 italic truncate max-w-[150px]">
                             "{item.options.note}"
                           </p>
                         )}
                       </div>
                    )}
                    <p className="text-[9px] text-bento-text/40 uppercase font-bold tracking-widest mt-1">SỐ LƯỢNG: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-xs">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="my-8 h-px bg-bento-accent/50" />

            <div className="space-y-3">
              <div className="flex justify-between text-bento-text/40 text-xs font-bold">
                <span>Tiền hàng</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-500 text-xs font-bold">
                  <span>Mã giảm giá</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {membershipDiscount > 0 && (
                <div className="flex justify-between text-amber-500 text-xs font-bold">
                  <span>Ưu đãi {profile?.points && profile.points >= 500 ? 'Gold' : 'Silver'} Members</span>
                  <span>-{formatCurrency(membershipDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-bento-text/40 text-xs font-bold">
                <span>Vận chuyển</span>
                <span>{formatCurrency(15000)}</span>
              </div>
              <div className="flex justify-between text-bento-primary-dark text-xl font-black tracking-tighter pt-4 mt-4 border-t border-bento-accent">
                <span>TỔNG</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-8 p-5 bg-bento-hero/40 rounded-2xl border border-bento-hero-border space-y-3">
              <div className="flex items-center gap-2 text-bento-primary-dark">
                <Truck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Thời gian dự kiến</span>
              </div>
              <p className="font-bold text-xs">20 - 30 PHÚT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
