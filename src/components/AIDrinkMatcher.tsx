import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Coffee, Star, RefreshCw, ArrowRight, BrainCircuit } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { toast } from './ui/Toaster';

interface AIDrinkMatcherProps {
  onOpenDetails?: (product: Product) => void;
}

export function AIDrinkMatcher({ onOpenDetails }: AIDrinkMatcherProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    productName: string;
    reason: string;
    moodEmoji: string;
    product?: Product;
  } | null>(null);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      // 1. Get products for context
      const q = query(collection(db, 'products'), where('active', '==', true));
      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const menuContext = productList.map(p => `${p.name}: ${p.description}`).join('\n');

      // 2. Initialize Gemini
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `Bạn là chuyên gia tư vấn đồ uống thông minh tại cửa hàng "Chill Tea". 
Dựa vào tâm trạng, hoạt động hoặc sở hữu thích của khách hàng, hãy chọn món phù hợp nhất từ menu dưới đây.

Danh sách Menu:
${menuContext}

Khách hàng nói: "${input}"

Hãy trả về kết quả dưới dạng JSON với cấu trúc:
{
  "productName": "Tên sản phẩm chính xác từ menu",
  "reason": "Giải thích ngắn gọn tại sao món này phù hợp bằng tiếng Việt (khoảng 2 câu)",
  "moodEmoji": "1 emoji phù hợp với gợi ý"
}
Lưu ý: Chỉ trả về JSON, không kèm văn bản khác.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              reason: { type: Type.STRING },
              moodEmoji: { type: Type.STRING }
            },
            required: ["productName", "reason", "moodEmoji"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      
      // Find the actual product object to display details/image
      const matchedProduct = productList.find(p => 
        p.name.toLowerCase().includes(data.productName.toLowerCase()) || 
        data.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      setRecommendation({
        ...data,
        product: matchedProduct
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
      toast.error("Không thể kết nối với trí tuệ nhân tạo lúc này. Thử lại sau nhé!");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setRecommendation(null);
    setInput('');
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="bg-bento-primary-dark rounded-[4rem] p-12 lg:p-24 relative overflow-hidden group shadow-2xl">
        {/* Abstract Background Bits */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-bento-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-bento-primary/30 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-bento-accent/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
          {/* Text Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
               <BrainCircuit className="w-4 h-4 text-bento-accent" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Chill AI Assistant</span>
            </div>
            <h2 className="text-5xl lg:text-7xl font-display font-black tracking-tighter uppercase leading-[0.85] text-white">
              Cảm hứng <br/> <span className="text-bento-accent">VỊ GIÁC</span> Từ AI
            </h2>
            <p className="text-lg text-white/60 font-medium leading-relaxed max-w-lg">
              Bạn đang cảm thấy thế nào? Hãy chia sẻ với trợ lý mã hóa hương vị của chúng tôi để tìm thấy ly nước "định mệnh" dành riêng cho bạn ngay lúc này.
            </p>

            <AnimatePresence mode="wait">
              {!recommendation ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleMatch} 
                  className="relative group/form"
                >
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="VD: 'Đang mệt mỏi sau giờ làm', 'Cần gì đó thật mát lạnh',..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-6 text-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-bento-primary/20 transition-all placeholder:text-white/20 capitalize pr-20"
                  />
                  <button 
                    disabled={loading || !input.trim()}
                    className="absolute right-3 top-3 bottom-3 aspect-square bg-bento-accent text-bento-primary rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-bento-accent/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                   key="result"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-8 lg:p-10 border border-white/20 relative group/result"
                >
                   <button 
                     onClick={clear}
                     className="absolute -top-4 -right-4 w-12 h-12 bg-white text-bento-primary-dark rounded-full shadow-xl flex items-center justify-center hover:rotate-90 transition-transform"
                   >
                     <RefreshCw className="w-5 h-5" />
                   </button>

                   <div className="flex flex-col md:flex-row gap-10 items-center">
                     {recommendation.product?.image && (
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl group-hover/result:scale-110 transition-transform duration-700 shrink-0">
                           <img src={recommendation.product.image} className="w-full h-full object-cover" alt="Suggest" />
                        </div>
                     )}
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="text-3xl">{recommendation.moodEmoji}</span>
                           <div className="h-px w-8 bg-bento-accent/40" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-bento-accent">Perfect match found</span>
                        </div>
                        <h3 className="text-3xl font-display font-black text-white uppercase tracking-tight">{recommendation.productName}</h3>
                        <p className="text-sm text-white/50 leading-relaxed italic">"{recommendation.reason}"</p>
                        <div className="pt-4 flex gap-4">
                           <button 
                             onClick={() => recommendation.product && onOpenDetails?.(recommendation.product)}
                             className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-bento-accent transition-colors group/btn"
                           >
                              Chi tiết món <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1" />
                           </button>
                        </div>
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visual Side */}
          <div className="hidden lg:block w-[450px] relative">
             <div className="aspect-square relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_#8EACCD_0%,transparent_40%,_#D2E0FB_100%)] rounded-full animate-[spin_10s_linear_infinite] opacity-20" />
                <div className="w-64 h-64 bg-white/5 rounded-full backdrop-blur-3xl border border-white/20 flex items-center justify-center relative shadow-[0_0_80px_rgba(255,255,255,0.05)]">
                   <div className="absolute inset-0 bg-gradient-to-br from-bento-primary to-transparent opacity-10 rounded-full" />
                   <div className="relative flex flex-col items-center">
                     <Sparkles className="w-16 h-16 text-bento-accent animate-pulse mb-6" />
                     <div className="flex -space-x-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-12 h-12 rounded-2xl bg-white/10 border-2 border-bento-primary-dark backdrop-blur-xl flex items-center justify-center overflow-hidden">
                             <Coffee className="w-6 h-6 text-white/20" />
                          </div>
                        ))}
                     </div>
                   </div>
                </div>

                {/* Floating tags */}
                <div className="absolute top-10 left-0 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 -rotate-6 shadow-xl animate-bounce [animation-delay:0.5s]">
                   <span className="text-[10px] font-black text-white uppercase">Refreshing</span>
                </div>
                <div className="absolute bottom-20 right-0 bg-bento-accent text-bento-primary px-6 py-3 rounded-2xl rotate-12 shadow-xl animate-bounce">
                   <span className="text-[10px] font-black uppercase tracking-widest">Chill Vibes</span>
                </div>
                <div className="absolute top-1/2 -right-4 bg-white text-bento-primary p-4 rounded-3xl scale-90 shadow-2xl -rotate-12 animate-pulse">
                   <Star className="w-6 h-6 fill-current" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
