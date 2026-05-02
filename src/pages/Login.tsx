import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { toast } from '../components/ui/Toaster';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithEmail, login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Chào mừng bạn quay lại!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Email hoặc mật khẩu không đúng';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email hoặc mật khẩu không chính xác';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều lần thử thất bại. Vui lòng thử lại sau.';
      } else if (error.message && error.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(error.message);
          errorMessage = parsed.error || errorMessage;
        } catch (e) {}
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra');
      console.error(error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email để đặt lại mật khẩu');
      return;
    }
    try {
      await resetPassword(email);
      toast.success('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư!');
    } catch (error: any) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
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
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">ĐĂNG NHẬP</h1>
          <p className="text-bento-text/40 text-sm font-bold uppercase tracking-widest">Chào mừng bạn trở lại</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
                className="w-full pl-12 pr-6 py-4.5 bg-bento-bg/50 rounded-2xl focus:outline-none focus:ring-8 focus:ring-bento-primary/5 border border-transparent focus:border-bento-primary/30 text-sm font-sans transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pr-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-bento-text/30 pl-2">Mật khẩu</label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-[9px] font-bold uppercase tracking-widest text-bento-primary hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-text/20" />
              <input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                Đăng nhập
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-bento-accent"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
            <span className="bg-white px-4 text-bento-text/20">Hoặc</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white border border-bento-accent text-bento-text rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-bento-bg transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Tiếp tục với Google
        </button>

        <p className="text-center text-xs font-bold text-bento-text/40">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-bento-primary hover:underline flex items-center gap-1 justify-center mt-2 group">
            Đăng ký ngay
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
