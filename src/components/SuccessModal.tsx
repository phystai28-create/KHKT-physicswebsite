import React, { useEffect } from 'react';
import { CheckCircle2, Download, RotateCcw, X, Award } from 'lucide-react';
import { CANONICAL_TEACHER_INFO } from '../utils/physics';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRemoteSubmitted: boolean;
  onDownloadAgain: () => void;
  onResetLab: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  isRemoteSubmitted,
  onDownloadAgain,
  onResetLab,
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-center transform transition-all scale-100">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Badge Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 stroke-[2.5]" />
        </div>

        {/* Main Heading and Subtext */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Award className="w-4 h-4 text-amber-700" />
            <span>HOÀN THÀNH NGHIÊN CỨU KHOA HỌC</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            CHÚC MỪNG EM ĐÃ HOÀN THÀNH XUẤT SẮC DỰ ÁN!
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
            {isRemoteSubmitted
              ? 'Báo cáo PDF đã được tạo thành công và dữ liệu báo cáo đã được gửi đến máy chủ của giáo viên.'
              : 'Báo cáo PDF của em đã được tạo thành công và sẵn sàng tải về. Dữ liệu hiện được xử lí trên thiết bị này vì hệ thống chưa kết nối máy chủ của giáo viên.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onDownloadAgain}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Tải lại báo cáo bản PDF</span>
          </button>

          <button
            type="button"
            onClick={onResetLab}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Làm lại thí nghiệm từ đầu</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Dự án nghiên cứu Vật lí 11
        </div>
      </div>
    </div>
  );
};
