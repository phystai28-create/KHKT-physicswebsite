import React, { useState, useRef } from 'react';
import { BridgeCanvasP5 } from './BridgeCanvasP5';
import { validateHypothesis, MIN_HYPOTHESIS_LENGTH, MIN_MATCHED_KEYWORDS } from '../utils/physics';
import {
  ArrowRight,
  AlertCircle,
  Footprints,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Interface1Props {
  isMarching: boolean;
  onToggleMarching: () => void;
  onSetMarching?: (marching: boolean) => void;
  userHypothesis: string;
  onHypothesisChange: (hypothesis: string) => void;
  onHypothesisSubmit: () => void;
  isUnlocked: boolean;
}

export const Interface1_Problem: React.FC<Interface1Props> = ({
  isMarching,
  onToggleMarching,
  onSetMarching,
  userHypothesis,
  onHypothesisChange,
  onHypothesisSubmit,
}) => {
  const [validationError, setValidationError] = useState<{
    message: string;
    secondaryHint?: string;
  } | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelectMarching = (marching: boolean) => {
    if (onSetMarching) {
      onSetMarching(marching);
    } else if (isMarching !== marching) {
      onToggleMarching();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateHypothesis(userHypothesis);
    if (!result.isValid) {
      setValidationError({
        message: result.message,
        secondaryHint: result.secondaryHint,
      });
      setSuccessNotice(null);
      textareaRef.current?.focus();
      return;
    }
    setValidationError(null);
    setSuccessNotice(
      'Giả thuyết hợp lệ! Em có thể tiếp tục thiết kế thực nghiệm để kiểm chứng dự đoán của mình.'
    );
    setTimeout(() => {
      onHypothesisSubmit();
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Balanced Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bridge Simulation Panel (~58%) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                MÔ PHỎNG
              </h2>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isMarching
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isMarching ? 'Chế độ: Đi đều bước' : 'Chế độ: Đi tự do'}
            </span>
          </div>

          {/* Canvas with Fullscreen and Raised Bridge Deck */}
          <BridgeCanvasP5
            isMarching={isMarching}
            onToggleMarching={onToggleMarching}
            onSetMarching={onSetMarching}
          />

          {/* TWO PROMINENT MARCHING-MODE BUTTONS */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-blue-600" />
                MỆNH LỆNH HÀNH QUÂN QUA CẦU:
              </span>
              <span className="text-[11px] text-slate-400">
                Nhấp chọn để thay đổi quy luật bước chân của đoàn quân
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Đi đều bước */}
              <button
                type="button"
                onClick={() => handleSelectMarching(true)}
                className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isMarching
                    ? 'bg-red-50/90 border-red-500 ring-2 ring-red-400/50 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isMarching ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          isMarching ? 'text-red-950' : 'text-slate-800'
                        }`}
                      >
                        Đi đều bước
                      </span>
                    </div>
                    {isMarching && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tất cả chiến sĩ dậm chân <strong className="text-red-700 font-semibold">cùng nhịp và cùng pha</strong>. Tạo ngoại lực tuần hoàn kích thích dao động tăng mạnh.
                  </p>
                </div>
              </button>

              {/* Button 2: Đi tự do */}
              <button
                type="button"
                onClick={() => handleSelectMarching(false)}
                className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  !isMarching
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/50 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          !isMarching ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          !isMarching ? 'text-emerald-950' : 'text-slate-800'
                        }`}
                      >
                        Đi tự do
                      </span>
                    </div>
                    {!isMarching && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Các chiến sĩ bước <strong className="text-emerald-700 font-semibold">lệch pha ngẫu nhiên</strong>. Ngoại lực phân tán và triệt tiêu lẫn nhau (∑F ≈ 0).
                  </p>
                </div>
              </button>
            </div>

            {/* Dynamic Physical Explanation Banner */}
            <div
              className={`p-3 rounded-lg border text-xs leading-relaxed transition-colors ${
                isMarching
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              {isMarching ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-red-700">Nguy hiểm: </strong>
                    Toàn bộ đoàn quân đồng thời dậm chân cùng thời điểm, cung cấp năng lượng liên tục ở cùng một tần số khiến biên độ uốn lượn của mặt cầu tăng vọt tới mức nguy hiểm.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-emerald-800">An toàn: </strong>
                    Khi lệnh đi tự do được phát ra, các bước chân không còn cùng thời điểm. Ngoại lực tác động bù trừ ngẫu nhiên, giúp dao động của cầu giảm dần và ổn định.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Hypothesis Task (~42%) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block">
              NHIỆM VỤ 01
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug">
              Tại sao khi đi qua cầu treo, các đoàn quân thường được lệnh chuyển từ đi đều sang đi tự do mà không bước cùng nhịp?
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="userHypothesis"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800"
              >
                GIẢ THUYẾT CỦA EM
              </label>
              <p className="text-xs text-slate-600">
                Hãy trình bày suy nghĩ của em dựa trên hiện tượng vừa quan sát.
              </p>
              <textarea
                ref={textareaRef}
                id="userHypothesis"
                rows={5}
                value={userHypothesis}
                onChange={(e) => {
                  onHypothesisChange(e.target.value);
                  if (validationError) setValidationError(null);
                  if (successNotice) setSuccessNotice(null);
                }}
                placeholder="Nhập suy nghĩ và giả thuyết của em tại đây..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors resize-y leading-relaxed font-sans"
              />

              {/* Exact required conceptual keyword cues below the input */}
              <div className="pt-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg leading-relaxed">
                <span className="font-semibold text-slate-700">Từ khóa gợi mở: </span>
                <span className="text-slate-800 font-medium">
                  nhịp · đều · bước chân · tần số · biên độ · rung lắc · cộng hưởng
                </span>
              </div>

              {/* Live Character Counter */}
              <div className="flex justify-between items-center text-[11px] pt-0.5">
                <span className={userHypothesis.trim().length >= MIN_HYPOTHESIS_LENGTH ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  {userHypothesis.trim().length}/{MIN_HYPOTHESIS_LENGTH} ký tự tối thiểu
                  {userHypothesis.trim().length >= MIN_HYPOTHESIS_LENGTH && ' ✓'}
                </span>
                <span className="text-slate-400">
                  Cần ít nhất {MIN_MATCHED_KEYWORDS} từ khóa gợi mở khác nhau
                </span>
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-red-900 leading-snug">
                    {validationError.message}
                  </div>
                  {validationError.secondaryHint && (
                    <div className="text-[11px] text-red-700 leading-normal">
                      {validationError.secondaryHint}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Notice */}
            {successNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-medium text-emerald-900 leading-snug">
                  {successNotice}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <span>Tiến hành thí nghiệm kiểm chứng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
