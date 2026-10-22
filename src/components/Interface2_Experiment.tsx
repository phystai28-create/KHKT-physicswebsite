import React, { useState } from 'react';
import { DataPoint, ExperimentPlanning } from '../types/physics';
import { formatVietnameseNumber } from '../utils/physics';
import { BridgeOscillationCanvas } from './BridgeOscillationCanvas';
import { KnowledgeModal } from './KnowledgeModal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Play,
  RotateCcw,
  Check,
  BookOpen,
  LineChart as LineChartIcon,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface Interface2Props {
  userHypothesis: string;
  planning: ExperimentPlanning;
  onUpdatePlanning: (independent: string, control: string, isConfirmed: boolean) => void;
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  dataPoints: DataPoint[];
  onAddDataPoint: (point: DataPoint) => void;
  onRemoveDataPoint: (id: string) => void;
  onClearDataPoints?: () => void;
  onOpenReport: () => void;
}

// Secret natural frequency f0 = 2.0 Hz (Kept internal, never revealed directly)
const INTERNAL_F0 = 2.0;

// Standard Lorentzian function: A = 100 / (1 + 4 * Math.pow(f - 2.0, 2))
// Smooth bell curve: f=2.0 -> A=100; f=1.5 -> A=50; f=1.0 -> A=20 (cm)
// Precision accurate to hundredths place (hàng phần trăm)
function computeAmplitude(f: number): number {
  const rawA = 100 / (1 + 4 * Math.pow(f - INTERNAL_F0, 2));
  return parseFloat(rawA.toFixed(2));
}

export const Interface2_Experiment: React.FC<Interface2Props> = ({
  userHypothesis,
  planning,
  onUpdatePlanning,
  frequency,
  onFrequencyChange,
  dataPoints,
  onAddDataPoint,
  onRemoveDataPoint,
  onClearDataPoints,
  onOpenReport,
}) => {
  // --- Planning Step State ---
  type VariableChoice = 'change' | 'keep' | null;

  const [frequencyChoice, setFrequencyChoice] = useState<VariableChoice>(
    planning.isConfirmed && planning.independentVariable === 'Tần số bước chân' ? 'change' : null
  );
  const [massChoice, setMassChoice] = useState<VariableChoice>(
    planning.isConfirmed ? 'keep' : null
  );
  const [structureChoice, setStructureChoice] = useState<VariableChoice>(
    planning.isConfirmed ? 'keep' : null
  );

  const [planFeedback, setPlanFeedback] = useState<{
    type: 'error' | 'success' | null;
    message: string;
  }>({
    type: planning.isConfirmed ? 'success' : null,
    message: planning.isConfirmed
      ? 'Kế hoạch thành công! Phòng thí nghiệm ảo đã mở khóa để em tiến hành đo đạc.'
      : '',
  });

  // --- Data Collection State (Strict 5 measurements, Input instead of slider) ---
  const [freqInputValue, setFreqInputValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  // --- Graph & Resonance Gate State ---
  const [showChart, setShowChart] = useState<boolean>(false);
  const [resonanceAnswer, setResonanceAnswer] = useState<string>('');
  const [isGatePassed, setIsGatePassed] = useState<boolean>(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);
  const [gateFeedback, setGateFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Amplitude of current live canvas
  const currentAmplitude = computeAmplitude(frequency);

  // Confirm Planning variables
  const handleConfirmPlan = () => {
    if (!frequencyChoice || !massChoice || !structureChoice) {
      setPlanFeedback({
        type: 'error',
        message: 'Vui lòng đưa ra quyết định [Thay đổi] hoặc [Giữ nguyên] cho tất cả 3 đại lượng bên dưới trước khi xác nhận!',
      });
      return;
    }

    const isFreqCorrect = frequencyChoice === 'change';
    const isMassCorrect = massChoice === 'keep';
    const isStructureCorrect = structureChoice === 'keep';

    if (isFreqCorrect && isMassCorrect && isStructureCorrect) {
      setPlanFeedback({
        type: 'success',
        message: 'Kế hoạch thành công! Em đã chọn đúng: Thay đổi tần số bước chân và Giữ nguyên khối lượng đoàn quân cùng cấu trúc cầu.',
      });
      onUpdatePlanning(
        'Tần số bước chân',
        'Khối lượng đoàn quân & Cấu trúc của cầu',
        true
      );
    } else {
      setPlanFeedback({
        type: 'error',
        message: 'Kế hoạch chưa tối ưu',
      });
      onUpdatePlanning('Tần số bước chân', 'Khối lượng đoàn quân & Cấu trúc của cầu', false);
    }
  };

  // Submit a manual frequency measurement
  const handleRunAndRecord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    if (dataPoints.length >= 5) {
      setInputError('Đã đủ 5 mốc đo. Em hãy bấm "Vẽ đồ thị đi qua 5 điểm dữ liệu" bên dưới.');
      return;
    }

    const trimmed = freqInputValue.trim().replace(',', '.');
    if (!trimmed) {
      setInputError('Vui lòng nhập một giá trị tần số f hợp lệ.');
      return;
    }

    const parsedFreq = parseFloat(parseFloat(trimmed).toFixed(2));
    if (isNaN(parsedFreq) || parsedFreq <= 0) {
      setInputError('Tần số phải là một số dương hợp lệ (Hz).');
      return;
    }

    // Check duplicate with 0.005 tolerance so hundredths values are distinct
    const exists = dataPoints.some(
      (dp) => Math.abs(dp.frequency - parsedFreq) < 0.005
    );
    if (exists) {
      setInputError(`Tần số ${formatVietnameseNumber(parsedFreq, 2)} Hz đã được đo. Em hãy thử một giá trị khác nhé.`);
      return;
    }

    // Calculate A using Lorentzian formula: A = 100 / (1 + 4 * (f - 2.0)^2) rounded to 2 decimals (hàng phần trăm)
    const calculatedA = computeAmplitude(parsedFreq);

    // Update active simulation frequency and amplitude
    onFrequencyChange(parsedFreq);

    // Save as 1 row in the data table
    const newPoint: DataPoint = {
      id: `${Date.now()}-${Math.random()}`,
      frequency: parsedFreq,
      amplitude: calculatedA,
      timestamp: Date.now(),
    };
    onAddDataPoint(newPoint);

    // Reset input for next entry
    setFreqInputValue('');
  };

  // Reset entire experimental data
  const handleResetExperiment = () => {
    if (onClearDataPoints) {
      onClearDataPoints();
    } else {
      dataPoints.forEach((p) => onRemoveDataPoint(p.id));
    }
    setShowChart(false);
    setResonanceAnswer('');
    setIsGatePassed(false);
    setGateFeedback({ type: null, message: '' });
    setInputError(null);
    setFreqInputValue('');
  };

  // Check resonance gate answer
  const handleVerifyResonanceGate = () => {
    const raw = resonanceAnswer.trim().replace(',', '.');
    if (!raw) {
      setGateFeedback({
        type: 'error',
        message: 'Vui lòng nhập giá trị tần số mà em dự đoán cầu dao động mạnh nhất.',
      });
      return;
    }

    const parsed = parseFloat(raw);
    // Student must identify 2.0 (or 2)
    if (!isNaN(parsed) && Math.abs(parsed - 2.0) < 0.05) {
      setIsGatePassed(true);
      setGateFeedback({
        type: 'success',
        message: 'Chính xác! Tần số cộng hưởng của cây cầu là 2,0 Hz.',
      });
      setShowKnowledgeModal(true);
    } else {
      setIsGatePassed(false);
      setGateFeedback({
        type: 'error',
        message: 'Chưa chính xác! Hãy quan sát kĩ lại đỉnh của đồ thị hoặc bảng số liệu.',
      });
    }
  };

  // Requirement 3: Strictly sort the array ascending by frequency before passing to LineChart (chính xác hàng phần trăm)
  const sortedData = [...dataPoints]
    .sort((a, b) => a.frequency - b.frequency)
    .map((p) => ({
      frequency: parseFloat(p.frequency.toFixed(2)),
      amplitude: parseFloat(p.amplitude.toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      {/* Top Hypothesis Summary */}
      <div className="space-y-3">
        {/* Slim Pale Yellow Note for Hypothesis */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <span className="font-semibold text-amber-900 shrink-0">Giả thuyết của em:</span>
          <span className="text-slate-700 truncate sm:overflow-visible">“{userHypothesis || 'Chưa nhập'}”</span>
        </div>
      </div>

      {/* STATE A: Experimental Planning Challenge */}
      {!planning.isConfirmed ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block">
              NHIỆM VỤ 2: KẾ HOẠCH THỰC NGHIỆM
            </span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1">
              Để kiểm chứng giả thuyết trên, em hãy thiết lập phương án cho từng đại lượng:
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn một trong hai hành động <strong>[ Thay đổi ]</strong> hoặc <strong>[ Giữ nguyên ]</strong> cho mỗi đại lượng dưới đây.
            </p>
          </div>

          {/* List of 3 Variables with Dual Button Controls */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
            {/* Variable 1: Tần số bước chân */}
            <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 block">
                  1. Tần số bước chân
                </span>
                <span className="text-[11px] text-slate-500">
                  Nhịp bước chân của đoàn quân tác dụng lực tuần hoàn lên cầu
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setFrequencyChoice('change')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    frequencyChoice === 'change'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyChoice('keep')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    frequencyChoice === 'keep'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-700/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Giữ nguyên
                </button>
              </div>
            </div>

            {/* Variable 2: Khối lượng đoàn quân */}
            <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 block">
                  2. Khối lượng đoàn quân
                </span>
                <span className="text-[11px] text-slate-500">
                  Tổng tải trọng tĩnh của binh lính và trang thiết bị di chuyển trên cầu
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setMassChoice('change')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    massChoice === 'change'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setMassChoice('keep')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    massChoice === 'keep'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-700/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Giữ nguyên
                </button>
              </div>
            </div>

            {/* Variable 3: Cấu trúc của cầu */}
            <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/60 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 block">
                  3. Cấu trúc của cầu
                </span>
                <span className="text-[11px] text-slate-500">
                  Chiều dài nhịp cầu, độ cứng, vật liệu và tần số riêng f₀ của cầu
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setStructureChoice('change')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    structureChoice === 'change'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setStructureChoice('keep')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    structureChoice === 'keep'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-700/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  Giữ nguyên
                </button>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleConfirmPlan}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Xác nhận kế hoạch</span>
            </button>
          </div>

          {planFeedback.type === 'error' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{planFeedback.message}</span>
            </div>
          )}

          {/* Locked preview */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center py-8 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 text-center">
            <div className="space-y-1">
              <Lock className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="text-xs font-medium text-slate-600">
                Thiết lập đúng phương án kiểm soát biến số để mở khóa phòng thí nghiệm.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Plan Confirmation Row */
        <div className="bg-white rounded-lg border border-emerald-200 bg-emerald-50/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-slate-700">
              <strong className="text-emerald-800">Kế hoạch thành công:</strong> Đại lượng thay đổi [<strong>Tần số bước chân</strong>] • Đại lượng giữ nguyên [<strong>Khối lượng đoàn quân, Cấu trúc cầu</strong>]
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdatePlanning('Tần số bước chân', 'Khối lượng đoàn quân & Cấu trúc của cầu', false)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
          >
            Chỉnh sửa kế hoạch
          </button>
        </div>
      )}

      {/* STATE B: Active Laboratory Workspace (Visible when plan confirmed) */}
      {planning.isConfirmed && (
        <div className="space-y-6">
          {/* Box Hướng dẫn sau khi chọn xong các đại lượng (Font chữ to hơn, dễ đọc) */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-5 text-blue-950 flex items-start gap-3.5 shadow-xs">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                Hướng dẫn
              </h4>
              <p className="text-slate-800 leading-relaxed text-sm sm:text-[15px] font-normal">
                Dựa trên giả thuyết mà em đưa ra cũng như các đại lượng đã lựa chọn, hãy thay đổi tần số bước chân của đoàn quân để xem nó ảnh hưởng như thế nào đến sự dao động của cây cầu. Em hãy chọn 5 giá trị tần số bước chân, từ đó hãy xác định tại giá trị tần số là bao nhiêu hertz (Hz) cây cầu sẽ dao động với biên độ mạnh nhất?
              </p>
            </div>
          </div>

          {/* Main Two Columns: Left (Simulation & Manual Input) - Right (Table & Draw Graph Action) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (~55%): Simulation & Direct Number Input */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  MÔ PHỎNG DAO ĐỘNG CỦA CẦU
                </h3>
                <span className="text-xs text-slate-500">
                  Đã ghi nhận: <strong className="text-blue-700">{dataPoints.length}/5</strong> mốc đo
                </span>
              </div>

              {/* Dynamic p5.js Canvas Simulation */}
              <BridgeOscillationCanvas
                frequency={frequency}
                amplitude={currentAmplitude}
              />

              {/* Strict Manual Input Block (NO SLIDERS) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label
                    htmlFor="frequency-input"
                    className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Nhập tần số bước chân ngoại lực (f):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {dataPoints.length >= 5 ? (
                      <span className="text-emerald-700 font-semibold">✓ Đã đủ tối đa 5 lần đo</span>
                    ) : (
                      `Còn ${5 - dataPoints.length} lần đo`
                    )}
                  </span>
                </div>

                <form onSubmit={handleRunAndRecord} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="frequency-input"
                      type="number"
                      step="any"
                      min="0.1"
                      max="10.0"
                      disabled={dataPoints.length >= 5}
                      value={freqInputValue}
                      onChange={(e) => {
                        setFreqInputValue(e.target.value);
                        if (inputError) setInputError(null);
                      }}
                      placeholder={dataPoints.length >= 5 ? 'Đã đo đủ 5 lần' : 'Nhập giá trị f (Hz)...'}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-slate-900 transition-colors focus:outline-none ${
                        dataPoints.length >= 5
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      Hz
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={dataPoints.length >= 5 || !freqInputValue.trim()}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-xs ${
                      dataPoints.length >= 5 || !freqInputValue.trim()
                        ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Chạy & Ghi nhận số liệu</span>
                  </button>
                </form>

                {inputError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{inputError}</span>
                  </div>
                )}

                {/* Reset button to clear all measurements */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Hệ thống tự động tính biên độ A (cm) và lưu vào bảng kế bên.</span>
                  {dataPoints.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetExperiment}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
                      title="Xóa toàn bộ 5 số liệu và nhập lại từ đầu"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Làm lại từ đầu</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (~45%): Live Table & Unlock Button */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  BẢNG DỮ LIỆU ĐO ĐẠC
                </h3>
                <span className="text-xs text-slate-500">
                  {dataPoints.length}/5 hàng
                </span>
              </div>

              {/* 5-row measurement table with cm unit */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-14">Lần đo</th>
                      <th className="py-2.5 px-3">Tần số f (Hz)</th>
                      <th className="py-2.5 px-3">Biên độ A (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {[0, 1, 2, 3, 4].map((slotIdx) => {
                      const dp = dataPoints[slotIdx];
                      return (
                        <tr
                          key={`row-slot-${slotIdx}`}
                          className={dp ? 'hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/30'}
                        >
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                            #{slotIdx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            {dp ? (
                              <span className="font-semibold text-slate-800">
                                {formatVietnameseNumber(dp.frequency)} Hz
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">Chưa đo</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {dp ? (
                              <span className="font-bold text-blue-700">
                                {formatVietnameseNumber(dp.amplitude)} cm
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Requirement 3: Large Button shown ONLY when exactly 5 points are recorded */}
              {dataPoints.length >= 5 && !showChart && (
                <div className="pt-2 animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChart(true);
                      window.scrollTo({ top: 600, behavior: 'smooth' });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <LineChartIcon className="w-4 h-4 stroke-[2.5]" />
                    <span>Vẽ đồ thị đi qua 5 điểm dữ liệu</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    Nhấn vào đây để xem đường cong dao động nối liền 5 mốc đo em vừa thu thập.
                  </p>
                </div>
              )}

              {dataPoints.length < 5 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Em cần nhập đủ <strong>5 mốc tần số</strong> để hệ thống vẽ đồ thị thực nghiệm.</span>
                </div>
              )}
            </div>
          </div>

          {/* Requirement 3: Recharts Section - STRICTLY hidden initially, only visible after pressing the button */}
          {showChart && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-blue-600" />
                    ĐỒ THỊ THỰC NGHIỆM ĐI QUA 5 ĐIỂM DỮ LIỆU
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đường cong nối tuần tự 5 điểm đo thực nghiệm (trục hoành f theo Hz, trục tung biên độ A tính theo cm).
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-100"></span>
                  <span className="font-semibold text-slate-700">Đường cong thực nghiệm qua 5 mốc</span>
                </div>
              </div>

              {/* Requirement 2: Fixed Y-Axis at [0, 110] & Smooth monotone Curve */}
              <div className="h-64 sm:h-72 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sortedData}
                    margin={{ top: 15, right: 30, left: -5, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="frequency"
                      type="number"
                      domain={['dataMin - 0.2', 'dataMax + 0.2']}
                      tickFormatter={(val) => formatVietnameseNumber(val, 2)}
                      label={{
                        value: 'Tần số bước chân ngoại lực f (Hz)',
                        position: 'insideBottom',
                        offset: -12,
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 500 },
                      }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      domain={[0, 110]}
                      ticks={[0, 20, 40, 60, 80, 100, 110]}
                      label={{
                        value: 'Biên độ A (cm)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 15,
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 500 },
                      }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                              <div className="font-bold text-cyan-300">
                                Tần số f = {formatVietnameseNumber(item.frequency, 2)} Hz
                              </div>
                              <div className="text-emerald-300 font-semibold">
                                Biên độ A = {formatVietnameseNumber(item.amplitude, 2)} cm
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amplitude"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#1d4ed8' }}
                      name="Biên độ thực nghiệm"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Requirement 4: CỬA ẢI (GATE) - XÁC ĐỊNH TẦN SỐ CỘNG HƯỞNG (VIỀN ĐỎ NỔI BẬT) */}
              <div className="border-2 border-red-500 bg-red-50/40 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-red-700 tracking-wider uppercase block">
                      CỬA ẢI KIỂM CHỨNG KẾT QUẢ THỰC NGHIỆM
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      Dựa vào đồ thị và bảng số liệu, em hãy xác định cây cầu dao động với biên độ mạnh nhất khi tần số ngoại lực bằng bao nhiêu?
                    </h4>
                  </div>
                </div>

                {/* Input & Verification button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <div className="relative flex-1 sm:max-w-xs">
                    <input
                      type="text"
                      value={resonanceAnswer}
                      onChange={(e) => {
                        setResonanceAnswer(e.target.value);
                        if (gateFeedback.type) setGateFeedback({ type: null, message: '' });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyResonanceGate();
                      }}
                      placeholder="Nhập giá trị f..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      Hz
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyResonanceGate}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Xác nhận</span>
                  </button>
                </div>

                {/* Feedback Banners */}
                {gateFeedback.type === 'success' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">{gateFeedback.message}</strong>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Hiện tượng cộng hưởng cơ học xảy ra khi tần số ngoại lực bước chân trùng với tần số dao động riêng của cầu, khiến biên độ dao động đạt cực đại.
                      </p>
                    </div>
                  </div>
                )}

                {gateFeedback.type === 'error' && (
                  <div className="p-3.5 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{gateFeedback.message}</span>
                  </div>
                )}

                {/* Requirement 4: Nút tiếp tục sang bước Báo cáo CHỈ hiển thị khi trả lời đúng 2.0 */}
                {isGatePassed && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowKnowledgeModal(true)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg animate-in zoom-in-95 duration-200"
                    >
                      <span>💡 Xem Trạm kiến thức &amp; Viết báo cáo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trạm cung cấp kiến thức (Knowledge Modal) */}
      <KnowledgeModal
        isOpen={showKnowledgeModal}
        onClose={() => setShowKnowledgeModal(false)}
        onProceedToReport={onOpenReport}
      />
    </div>
  );
};
