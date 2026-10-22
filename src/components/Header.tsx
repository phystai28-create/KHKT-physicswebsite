import React from 'react';
import { RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onBackToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onBackToHome }) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-semibold text-blue-700">THPT FPT CẦN THƠ</span>
              <span>•</span>
              <span>DỰ ÁN NGHIÊN CỨU KHOA HỌC-KĨ THUẬT 2026-2027</span>
            </div>
            <p className="text-slate-700 font-bold text-[17px] text-justify">
              Khám phá hiện tượng cộng hưởng qua một thí nghiệm tương tác.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Quay lại màn hình danh sách thí nghiệm (lưu giữ tiến trình)"
              >
                <span>← Danh sách thí nghiệm</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Làm mới lại toàn bộ quá trình nghiên cứu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Thiết lập lại</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
