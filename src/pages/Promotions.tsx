import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift, Tag, ArrowRight, Percent, Calendar, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROMOTIONS = [
  {
    id: 1,
    title: "Mua 1 Tặng 1",
    subtitle: "Giờ vàng hạnh phúc",
    description: "Áp dụng cho toàn bộ dòng Trà Sữa đặc trưng tại cửa hàng vào khung giờ 14:00 - 17:00 mỗi ngày.",
    code: "HAPPYHOUR",
    expiry: "31/12/2026",
    color: "bg-amber-100",
    icon: <Gift className="w-10 h-10 text-amber-600" />
  },
  {
    id: 2,
    title: "Giảm 30% Tổng Đơn",
    subtitle: "Cho khách hàng lần đầu",
    description: "Ưu đãi đặc biệt dành riêng cho bạn khi lần đầu đặt hàng qua trang web của chúng tôi.",
    code: "WELCOME30",
    expiry: "Vĩnh viễn",
    color: "bg-rose-100",
    icon: <Tag className="w-10 h-10 text-rose-600" />
  },
  {
    id: 3,
    title: "Miễn Phí Vận Chuyển",
    subtitle: "Đơn hàng từ 150K",
    description: "Thỏa sức thưởng thức trà ngon tận nhà mà không lo phí ship trong bán kính 5km.",
    code: "FREESHIP",
    expiry: "Mỗi ngày",
    color: "bg-emerald-100",
    icon: <Percent className="w-10 h-10 text-emerald-600" />
  }
];

export default function Promotions() {
  return (
    <div className="min-h-screen pt-32 pb-24 bg-white overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-bento-primary/5 rounded-full blur-3xl -mr-[400px] -mt-[400px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -ml-[300px] -mb-[300px] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-20 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-bento-primary flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-primary">Chương trình ưu đãi</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase leading-[0.85] max-w-4xl"
          >
            Thưởng Thức <br/> <span className="opacity-10 text-bento-text">Thêm Nhiều</span> <br/> <span className="text-bento-primary italic">Niềm Vui</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-bento-text/50 max-w-xl font-medium leading-relaxed"
          >
            Khám phá những chương trình ưu đãi đặc biệt nhất dành riêng cho bạn. Đừng bỏ lỡ cơ hội thưởng thức trà ngon với giá cực hời!
          </motion.p>
        </header>

        <div className="grid gap-8">
          {PROMOTIONS.map((promo, i) => (
            <motion.div 
              key={promo.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
              className="group relative bg-white border border-bento-accent rounded-[3.5rem] p-8 md:p-12 overflow-hidden hover:shadow-2xl hover:border-bento-primary/30 transition-all duration-700"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 flex-1">
                  <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-[2.5rem] ${promo.color} flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                    {promo.icon}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-bento-bg rounded-lg text-[9px] font-black uppercase tracking-widest text-bento-text/40">{promo.subtitle}</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-bento-accent rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                        <Calendar className="w-3 h-3" /> HSD: {promo.expiry}
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">{promo.title}</h2>
                    <p className="text-sm md:text-base text-bento-text/50 font-medium leading-relaxed max-w-2xl">{promo.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-stretch md:items-end gap-6 w-full md:w-auto">
                  <div className="bg-bento-bg p-6 rounded-[2rem] border-2 border-dashed border-bento-accent flex flex-col items-center gap-2 group-hover:bg-white group-hover:border-bento-primary/50 transition-colors">
                    <p className="text-[9px] font-black uppercase tracking-widest text-bento-text/30">Mã ưu đãi</p>
                    <span className="text-2xl font-black text-bento-primary tracking-widest">{promo.code}</span>
                  </div>
                  <Link to="/shop" className="px-10 py-5 bg-bento-text text-white rounded-full font-black uppercase tracking-widest text-[10px] text-center hover:bg-bento-primary hover:-translate-y-1 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                    Sử dụng ngay <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-bento-bg rounded-[4rem] translate-x-1/2 -translate-y-1/2 rotate-45 -z-0 opacity-50 group-hover:bg-bento-primary/5 transition-colors" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-32 p-12 lg:p-24 bg-bento-text rounded-[4rem] relative overflow-hidden text-center space-y-10"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-0 left-[10%] w-[1px] h-full bg-white/20" />
            <div className="absolute top-0 left-[30%] w-[1px] h-full bg-white/20" />
            <div className="absolute top-0 left-[50%] w-[1px] h-full bg-white/20" />
            <div className="absolute top-0 left-[70%] w-[1px] h-full bg-white/20" />
            <div className="absolute top-0 left-[90%] w-[1px] h-full bg-white/20" />
          </div>

          <div className="relative z-10 space-y-6">
            <Heart className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none">Càng Đi Cùng Nhau <br/> <span className="text-bento-primary italic">Càng Tiết Kiệm</span></h2>
            <p className="text-white/40 max-w-xl mx-auto font-medium text-sm md:text-base leading-relaxed">Đăng ký thành viên ngay hôm nay để nhận thêm nhiều ưu đãi độc quyền dành riêng cho khách hàng thân thiết!</p>
          </div>

          <div className="relative z-10 pt-4">
             <button className="px-14 py-6 bg-white text-bento-text rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl">
               Đăng ký thành viên
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
