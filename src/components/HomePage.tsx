import React, { useState } from 'react';
import { ArrowRight, Sparkles, Activity, Layers, Bell, CheckCircle2, FlaskConical } from 'lucide-react';
import { CANONICAL_TEACHER_INFO } from '../utils/physics';

interface HomePageProps {
  onSelectExperiment: (experimentId: string) => void;
  hasSavedProgress?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectExperiment,
  hasSavedProgress = false,
}) => {
  const [showDevelopingToast, setShowDevelopingToast] = useState(false);

  const handleDevelopingClick = () => {
    setShowDevelopingToast(true);
    setTimeout(() => {
      setShowDevelopingToast(false);
    }, 3800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="font-semibold text-blue-700">THPT FPT CẦN THƠ</span>
                <span>•</span>
                <span>DỰ ÁN NGHIÊN CỨU KHOA HỌC-KĨ THUẬT 2026-2027</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Vật lí 11</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center">
        {/* Homepage Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Phòng thực nghiệm số</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            PHÒNG THÍ NGHIỆM VẬT LÍ
          </h1>
        </div>

        {/* Developing notification toast */}
        {showDevelopingToast && (
          <div className="max-w-md mx-auto mb-6 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm shadow-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
              <span className="font-medium">
                Thí nghiệm này đang được phát triển. Hãy quay lại sau nhé!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDevelopingToast(false)}
              className="text-amber-700 hover:text-amber-950 font-bold text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Exactly Two Experiment Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
          {/* Card 1 — Available Experiment: Hiện tượng cộng hưởng */}
          <div
            onClick={() => onSelectExperiment('resonance')}
            className="group relative bg-white rounded-2xl border-2 border-blue-600/30 hover:border-blue-600 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            {/* Top Badge & Progress Indicator */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Activity className="w-3.5 h-3.5" />
                <span>Chủ đề: Dao động</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đang hoạt động</span>
              </span>
            </div>

            {/* Scientific Abstract Physics Graphic: Resonance curve & suspension bridge lines */}
            <div className="w-full h-36 sm:h-44 bg-gradient-to-b from-blue-50/70 to-slate-50/80 rounded-xl border border-blue-100/70 p-3 flex items-center justify-center relative overflow-hidden mb-5">
              {/* Coordinate Grid Background */}
              <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern-resonance" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#93c5fd" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-resonance)" />
              </svg>

              {/* Dynamic Resonance Wave Curve & Bridge Suspension Vector */}
              <svg viewBox="0 0 320 120" className="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Coordinate axes */}
                <line x1="20" y1="105" x2="300" y2="105" stroke="#64748b" strokeWidth="1.2" />
                <line x1="30" y1="110" x2="30" y2="12" stroke="#64748b" strokeWidth="1.2" />
                <text x="290" y="117" fill="#64748b" fontSize="8" fontFamily="sans-serif">f (Hz)</text>
                <text x="14" y="16" fill="#64748b" fontSize="8" fontFamily="sans-serif">A</text>

                {/* Suspension bridge cable baseline */}
                <path d="M 35 45 Q 160 85 285 45" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="3 3" />
                {/* Bridge towers */}
                <line x1="35" y1="40" x2="35" y2="105" stroke="#475569" strokeWidth="2.5" />
                <line x1="285" y1="40" x2="285" y2="105" stroke="#475569" strokeWidth="2.5" />

                {/* Resonance Peak Curve (Lorentzian / Resonance Response) */}
                <path
                  d="M 35 102 C 100 101, 130 92, 150 55 C 157 32, 163 32, 170 55 C 190 92, 220 101, 285 102"
                  stroke="#2563eb"
                  strokeWidth="3"
                  className="group-hover:stroke-blue-700 transition-colors"
                />

                {/* Resonance peak frequency indicator */}
                <line x1="160" y1="28" x2="160" y2="105" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="2 2" />
                <circle cx="160" cy="30" r="4.5" fill="#ef4444" />
                <circle cx="160" cy="30" r="8" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
                <text x="165" y="24" fill="#dc2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">f₀</text>
              </svg>
            </div>

            {/* Title & Description */}
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Hiện tượng cộng hưởng
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Khám phá mối liên hệ giữa tần số ngoại lực, tần số riêng và biên độ dao động thông qua mô phỏng cầu treo.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                3 chặng: Giả thuyết → Thực nghiệm → Báo cáo
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs group-hover:shadow-md">
                <span>Bắt đầu thí nghiệm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2 — Future Experiments: Đang phát triển... */}
          <div
            onClick={handleDevelopingClick}
            className="group relative bg-white/70 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 cursor-pointer overflow-hidden opacity-85 hover:opacity-100"
          >
            {/* Top Inactive Badge */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <Layers className="w-3.5 h-3.5" />
                <span>Thí nghiệm tiếp theo</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                Sắp ra mắt
              </span>
            </div>

            {/* Abstract Minimalist Laboratory / Quantum Wave Illustration */}
            <div className="w-full h-36 sm:h-44 bg-slate-50 rounded-xl border border-slate-200/80 p-3 flex items-center justify-center relative overflow-hidden mb-5">
              {/* Subtle Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern-dev" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-dev)" />
              </svg>

              {/* Minimalist Waveforms & Particle Orbit Pattern */}
              <svg viewBox="0 0 320 120" className="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Subtle harmonic sine waves */}
                <path
                  d="M 20 60 Q 60 20 100 60 T 180 60 T 260 60 T 300 60"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 20 60 Q 60 90 100 60 T 180 60 T 260 60 T 300 60"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
                {/* Orbit ellipse */}
                <ellipse cx="160" cy="60" rx="45" ry="25" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="160" cy="60" r="5" fill="#94a3b8" />
                <circle cx="205" cy="60" r="3.5" fill="#64748b" />
                <circle cx="115" cy="60" r="3.5" fill="#64748b" />
              </svg>
            </div>

            {/* Title & Description */}
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                Đang phát triển...
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Những thí nghiệm Vật lí tương tác mới sẽ được bổ sung trong thời gian tới.
              </p>
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-medium">
                Dự án nghiên cứu mở rộng
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs sm:text-sm border border-slate-200">
                <span>Chưa khả dụng</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>THPT FPT Cần Thơ — Dự án Nghiên cứu Khoa học - Kĩ thuật</p>
        </div>
      </footer>
    </div>
  );
};
