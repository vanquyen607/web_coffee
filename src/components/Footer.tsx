import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, Mail, MapPin, Clock, Instagram, 
  Facebook, Youtube, Twitter, ArrowUpRight, Heart
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-bento-accent pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24 mb-24">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-bento-primary rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-bento-primary/20 group-hover:rotate-12 transition-all duration-500">
                <span className="text-2xl font-black italic">CT</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter uppercase leading-none text-bento-primary">Chill Tea</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-1">Vietnamese Spirit</span>
              </div>
            </Link>
            <p className="text-sm text-bento-text/50 font-medium leading-relaxed">
              Tự hào mang đến những ly trà sữa đậm vị và cà phê nguyên bản, kết hợp cùng không gian thư giãn tối giản. Chill Tea không chỉ là đồ uống, đó là một phong cách sống.
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Instagram className="w-5 h-5" />, link: "#" },
                { icon: <Facebook className="w-5 h-5" />, link: "#" },
                { icon: <Youtube className="w-5 h-5" />, link: "#" },
                { icon: <Twitter className="w-5 h-5" />, link: "#" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.link} 
                  className="w-10 h-10 rounded-xl bg-bento-bg flex items-center justify-center text-bento-text/40 hover:bg-bento-primary hover:text-white transition-all active:scale-90"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-primary">Khám phá</h4>
            <ul className="space-y-4">
              {[
                { name: "Thực đơn chính", path: "/shop" },
                { name: "Sản phẩm mới", path: "/shop" },
                { name: "Khuyến mãi", path: "/promotions" },
                { name: "Chill Club", path: "/register" },
                { name: "Hệ thống cửa hàng", path: "/about" }
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-sm font-bold text-bento-text/60 hover:text-bento-primary transition-colors flex items-center justify-between group">
                    {link.name}
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-primary">Thông tin</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-bento-bg flex-shrink-0 flex items-center justify-center text-bento-primary/40">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-bento-text/30 mb-1">Địa chỉ</p>
                  <p className="text-sm font-bold leading-snug">234 Nguyễn Huệ, Quận 1,<br/>Thành phố Hồ Chí Minh</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-bento-bg flex-shrink-0 flex items-center justify-center text-bento-primary/40">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-bento-text/30 mb-1">Hotline</p>
                  <p className="text-sm font-bold">1900 6789</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-bento-bg flex-shrink-0 flex items-center justify-center text-bento-primary/40">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-bento-text/30 mb-1">Giờ mở cửa</p>
                  <p className="text-sm font-bold">07:00 AM - 10:30 PM</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-primary">Newsletter</h4>
            <p className="text-sm text-bento-text/50 font-medium leading-relaxed">
              Đăng ký để nhận tin tức về món mới và ưu đãi độc quyền sớm nhất.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email của bạn"
                className="w-full bg-bento-bg border border-bento-accent rounded-2xl px-6 py-4 text-xs font-medium focus:outline-none focus:ring-4 focus:ring-bento-primary/5 transition-all"
              />
              <button className="w-full bg-bento-text text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bento-primary transition-all shadow-lg active:scale-95">
                Đăng ký nhận tin
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-bento-bg flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-bento-text/20">
            <span>© {currentYear} CHILL TEA VIETNAM</span>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-bento-accent" />
            <Link to="#" className="hover:text-bento-primary transition-colors">Điều khoản bảo mật</Link>
            <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-bento-accent" />
            <Link to="#" className="hover:text-bento-primary transition-colors">Chính sách vận chuyển</Link>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-bold text-bento-text/30">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> by Chill Development
          </div>
        </div>
      </div>
    </footer>
  );
}
