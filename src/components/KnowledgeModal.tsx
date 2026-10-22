import React from 'react';
import { Lightbulb, Activity, Zap, Flame, X, ArrowRight } from 'lucide-react';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToReport: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  isOpen,
  onClose,
  onProceedToReport,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClose();
    onProceedToReport();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 my-auto text-left">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs border border-amber-200">
            <Lightbulb className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase block">
              Trạm cung cấp kiến thức
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>💡 TỪ DỮ LIỆU ĐẾN CHÂN LÍ KHOA HỌC</span>
            </h2>
          </div>
        </div>

        {/* Section 1: Khen ngợi */}
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
          Tuyệt vời! Em vừa tự tay phát hiện ra một quy luật quan trọng của tự nhiên. Trong Vật lí, chúng ta có những tên gọi chính thức cho hiện tượng em vừa thấy:
        </p>

        {/* Section 2, 3, 4: Thẻ định nghĩa nổi bật */}
        <div className="space-y-3 pt-1">
          {/* Card 1: Dao động cưỡng bức */}
          <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 shadow-2xs hover:border-blue-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-blue-950 uppercase tracking-wide">
                  Dao động cưỡng bức
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  Là hiện tượng cây cầu phải dao động theo nhịp bước chân của đoàn quân, tức là chịu tác dụng của <strong className="text-blue-900">ngoại lực tuần hoàn</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Tần số riêng (f₀) */}
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 shadow-2xs hover:border-amber-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wide">
                  Tần số riêng (f₀)
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  Cây cầu nào cũng có một &ldquo;nhịp đập&rdquo; tự nhiên của riêng nó, phụ thuộc vào kết cấu (với cây cầu này là <strong className="text-amber-900 font-bold">f₀ = 2,0 Hz</strong>).
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Hiện tượng CỘNG HƯỞNG */}
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400/80 shadow-2xs ring-2 ring-red-500/10 hover:border-red-500 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-red-600 text-white shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-red-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Hiện tượng CỘNG HƯỞNG</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  Chính là điều em vừa tìm ra! Khi tần số của ngoại lực <strong className="text-red-700 font-bold uppercase underline">BẰNG</strong> với tần số riêng của hệ (<strong className="text-red-700 font-bold">f = f₀ = 2,0 Hz</strong>), biên độ dao động sẽ tăng vọt lên mức <strong className="text-red-700 font-extrabold uppercase">CỰC ĐẠI</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
          >
            <span>🚀 Đã hiểu kiến thức &amp; Tiến hành viết báo cáo</span>
            <ArrowRight className="w-5 h-5 stroke-[2.3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
