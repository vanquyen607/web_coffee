import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastCount = 0;
let addToastFn: (message: string, type: ToastType) => void;

export const toast = {
  success: (msg: string) => addToastFn?.(msg, 'success'),
  error: (msg: string) => addToastFn?.(msg, 'error'),
  info: (msg: string) => addToastFn?.(msg, 'info'),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = ++toastCount;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-sm px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-2xl transition-all",
              t.type === 'success' && "bg-white/90 border-green-500/20 text-bento-primary",
              t.type === 'error' && "bg-rose-50/90 border-rose-200 text-rose-600",
              t.type === 'info' && "bg-white/90 border-bento-accent text-bento-text"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              t.type === 'success' && "bg-green-500 text-white",
              t.type === 'error' && "bg-rose-500 text-white",
              t.type === 'info' && "bg-bento-bg text-bento-text"
            )}>
              {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <p className="flex-1 text-[11px] font-black uppercase tracking-widest">{t.message}</p>
            <button 
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 opacity-30" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
