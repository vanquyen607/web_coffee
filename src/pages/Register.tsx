import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import { toast } from '../components/ui/Toaster';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    setIsLoading(true);
    try {
      await registerWithEmail(email, password, name);
      toast.success('Đăng ký tài khoản thành công!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      
      let errorMessage = 'Đã có lỗi xảy ra';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu';
      } else if (error.message && error.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.error.includes('permissions')) {
            errorMessage = 'Lỗi phân quyền: Không thể tạo hồ sơ người dùng.';
          } else {
            errorMessage = parsed.error || errorMessage;
          }
        } catch (e) {
          // fallback
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 border border-bento-accent shadow-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">ĐĂNG KÝ</h1>
          <p className="text-bento-text/40 text-sm font-bold uppercase tracking-widest">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/20" />
              <input 
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn"
                className="w-full pl-12 pr-6 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-sans"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/20" />
              <input 
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-12 pr-6 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-sans"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/20" />
              <input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full pl-12 pr-6 py-4 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/20 text-sm font-sans"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-bento-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Đang xử lý...' : (
              <>
                Tạo tài khoản
                <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-bento-text/40">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-bento-primary hover:underline flex items-center gap-1 justify-center mt-2 group">
            Đăng nhập
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
