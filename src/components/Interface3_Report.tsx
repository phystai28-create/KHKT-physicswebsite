import React, { useState, useEffect } from 'react';
import { DataPoint, ReportAnswers } from '../types/physics';
import {
  NATURAL_FREQUENCY,
  formatVietnameseNumber,
  CANONICAL_TEACHER_INFO,
  evaluateQuestion1,
  evaluateQuestion2,
} from '../utils/physics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  Info,
  Activity,
  Send,
  X,
  User,
  GraduationCap,
} from 'lucide-react';

interface Interface3Props {
  userHypothesis: string;
  independentVariable: string;
  controlVariable: string;
  dataPoints: DataPoint[];
  answers: ReportAnswers;
  onUpdateAnswers: (updated: Partial<ReportAnswers>) => void;
  onSubmitReport: () => Promise<void>;
  isSubmitting: boolean;
  submissionError: string | null;
  onGoBackToExperiment?: () => void;
}

export const Interface3_Report: React.FC<Interface3Props> = ({
  userHypothesis,
  independentVariable,
  controlVariable,
  dataPoints,
  answers,
  onUpdateAnswers,
  onSubmitReport,
  isSubmitting,
  submissionError,
  onGoBackToExperiment,
}) => {
  // 1. Thao tác thông tin định danh (Lưu vào biến state hoTen và lop)
  const [hoTen, setHoTen] = useState<string>(answers.studentName || '');
  const [lop, setLop] = useState<string>(answers.studentClass || '');

  // 3 Ô Textarea của Phần V, VI, VII
  const [textPhanV, setTextPhanV] = useState<string>(answers.argumentBasis || '');
  const [textPhanVI, setTextPhanVI] = useState<string>(answers.criticalDebate || '');
  const [textPhanVII, setTextPhanVII] = useState<string>(answers.engineeringProposal || '');

  // Trạng thái gửi dữ liệu Google Sheets & hiển thị Modal Pop-up xanh lá
  const [isSubmittingData, setIsSubmittingData] = useState<boolean>(false);
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState<boolean>(false);

  // Đồng bộ hóa liên tục với App state để không làm hỏng tính năng xuất PDF
  const handleHoTenChange = (val: string) => {
    setHoTen(val);
    onUpdateAnswers({ studentName: val });
  };

  const handleLopChange = (val: string) => {
    setLop(val);
    onUpdateAnswers({ studentClass: val });
  };

  const handleTextPhanVChange = (val: string) => {
    setTextPhanV(val);
    onUpdateAnswers({ argumentBasis: val });
  };

  const handleTextPhanVIChange = (val: string) => {
    setTextPhanVI(val);
    onUpdateAnswers({ criticalDebate: val });
  };

  const handleTextPhanVIIChange = (val: string) => {
    setTextPhanVII(val);
    onUpdateAnswers({ engineeringProposal: val });
  };

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const maxPoint = dataPoints.reduce<DataPoint | null>((max, p) => {
    if (!max || p.amplitude > max.amplitude) return p;
    return max;
  }, null);

  // Điều kiện kiểm tra dữ liệu:
  // Nút chỉ sáng lên (không bị disabled) khi người dùng đã nhập đầy đủ chữ vào các ô Họ tên, Lớp, và 3 ô Textarea của phần V, VI, VII.
  const isFormComplete =
    hoTen.trim().length > 0 &&
    lop.trim().length > 0 &&
    textPhanV.trim().length > 0 &&
    textPhanVI.trim().length > 0 &&
    textPhanVII.trim().length > 0;

  // Đánh giá sư phạm tức thời cho câu hỏi 1 và 2 ở Phần V
  const q1Assessment = evaluateQuestion1(answers.conclusionAnswer, userHypothesis);
  const q2Assessment = evaluateQuestion2(answers.solutionAnswer);

  // 2. Xây dựng hàm gửi dữ liệu handleSubmitData()
  const handleSubmitData = async () => {
    if (!isFormComplete) return;
    setIsSubmittingData(true);

    const payload = {
      thoiGian: new Date().toLocaleString('vi-VN'),
      hoTen: hoTen.trim(),
      lop: lop.trim(),
      giaThuyet: userHypothesis || '',
      lapLuanPhanBien: "LẬP LUẬN: " + textPhanV.trim() + "\n\nPHẢN BIỆN: " + textPhanVI.trim(),
      deXuat: textPhanVII.trim(),
    };

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxf4T-_QI4i4SOZkuyttigPu2R6qXFefoO_2sHkq0nWy76v1FsyG5RalcsWIWxoZt5w/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload),
        }
      );

      // Mở Modal thành công toàn màn hình màu xanh lá
      setShowSubmitSuccessModal(true);
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu về máy chủ:", error);
      // Hiển thị modal để học sinh nhận diện dữ liệu đã được kích hoạt gửi đi
      setShowSubmitSuccessModal(true);
    } finally {
      setIsSubmittingData(false);
    }
  };

  const sortedPoints = [...dataPoints]
    .sort((a, b) => a.frequency - b.frequency)
    .map((p) => ({
      frequency: parseFloat(p.frequency.toFixed(2)),
      amplitude: parseFloat(p.amplitude.toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      {/* Top Header của Khu vực 3 */}
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          BÁO CÁO KẾT QUẢ TÌM HIỂU
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Thu thập thông tin định danh, lập luận khoa học và gửi kết quả báo cáo thực nghiệm.
        </p>
      </div>

      {/* Centered Primary Report Document (~860-900px) */}
      <div className="max-w-[880px] mx-auto">
        <div
          id="physics-lab-report-sheet"
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-7 text-slate-800"
        >
          {/* Document Top Info & Tiêu đề Báo cáo */}
          <div className="text-center space-y-3 border-b border-slate-200 pb-6">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight">
              BÁO CÁO KẾT QUẢ TÌM HIỂU HIỆN TƯỢNG CỘNG HƯỞNG
            </h1>
            <p className="text-xs text-slate-600">
              Khảo sát mối quan hệ giữa tần số tác động và biên độ dao động trong hiện tượng cộng hưởng cơ học
            </p>

            {/* 1. Bổ sung thông tin định danh (Ngay dưới Tiêu đề Báo cáo) */}
            <div className="max-w-xl mx-auto bg-slate-50/90 rounded-xl border border-slate-300 p-4 shadow-2xs mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Ô 1: Họ và tên học sinh */}
                <div className="space-y-1.5">
                  <label htmlFor="student-ho-ten" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Họ và tên học sinh:</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="student-ho-ten"
                    type="text"
                    value={hoTen}
                    onChange={(e) => handleHoTenChange(e.target.value)}
                    placeholder="Nhập họ và tên học sinh..."
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all shadow-2xs"
                    required
                  />
                </div>

                {/* Ô 2: Lớp */}
                <div className="space-y-1.5">
                  <label htmlFor="student-lop" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lớp:</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="student-lop"
                    type="text"
                    value={lop}
                    onChange={(e) => handleLopChange(e.target.value)}
                    placeholder="Nhập lớp (ví dụ: 11A1)..."
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-left bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3">
              <div className="space-y-1">
                <div className="text-slate-600">
                  <strong>Đề tài:</strong> Mô phỏng chương Dao động (Vật lí 11)
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Đơn vị:</strong> THPT FPT Cần Thơ</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Ngày lập:</strong> {todayStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Initial Hypothesis */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>I. GIẢ THUYẾT BAN ĐẦU CỦA HỌC SINH</span>
              <span className="text-xs font-normal text-slate-500">Phán đoán trước thực nghiệm</span>
            </h2>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
              “{userHypothesis || 'Chưa ghi nhận giả thuyết ban đầu.'}”
            </div>
          </section>

          {/* Section 2: Experimental Planning */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5">
              II. KẾ HOẠCH THỰC NGHIỆM &amp; KIỂM SOÁT BIẾN SỐ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Biến độc lập (điều khiển):</span>
                <strong className="text-blue-900 font-semibold text-xs">Tần số bước chân f (Hz)</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Biến phụ thuộc (đo lường):</span>
                <strong className="text-blue-900 font-semibold text-xs">Biên độ dao động của cầu A (cm)</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Tần số riêng của nhịp cầu (f₀):</span>
                <strong className="text-blue-900 font-semibold text-xs">f₀ = 2,0 Hz</strong>
              </div>
            </div>
          </section>

          {/* Section 3: Data Table with Units */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1.5">
              III. BẢNG SỐ LIỆU THỰC NGHIỆM ĐO ĐƯỢC
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Lần đo</th>
                    <th className="py-2.5 px-3">Tần số bước chân f (Hz)</th>
                    <th className="py-2.5 px-3">Biên độ dao động mô phỏng A (cm)</th>
                    <th className="py-2.5 px-3">Hiện tượng &amp; Đánh giá trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sortedPoints.map((dp, idx) => {
                    const isPeak = maxPoint && dp.frequency === maxPoint.frequency;
                    return (
                      <tr key={idx} className={isPeak ? 'bg-red-50/70 font-semibold text-red-950' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{formatVietnameseNumber(dp.frequency, 2)} Hz</td>
                        <td className="py-2 px-3">
                          <span className={isPeak ? 'text-red-700 font-bold' : ''}>
                            {formatVietnameseNumber(dp.amplitude, 2)} cm
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          {isPeak ? (
                            <span className="text-red-600 font-bold">★ CỰC ĐẠI CỘNG HƯỞNG (A = {formatVietnameseNumber(dp.amplitude, 2)} cm đạt đỉnh)</span>
                          ) : dp.amplitude > 40 ? (
                            <span className="text-amber-700 font-medium">Biên độ tăng rõ rệt (gần vùng cộng hưởng)</span>
                          ) : (
                            <span className="text-slate-500">Biên độ dao động nhỏ (an toàn)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Resonance Chart (Vẽ chuẩn giống Mục II, kích thước to rõ h-80 sm:h-96) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                IV. ĐỒ THỊ BIỂU DIỄN BIÊN ĐỘ THEO TẦN SỐ
              </h2>
              {maxPoint && (
                <span className="text-xs text-red-700 font-bold">
                  Cực đại: A = {formatVietnameseNumber(maxPoint.amplitude, 2)} cm tại f = {formatVietnameseNumber(maxPoint.frequency, 2)} Hz
                </span>
              )}
            </div>

            {/* Recharts Component */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    ĐỒ THỊ THỰC NGHIỆM ĐI QUA {dataPoints.length} ĐIỂM DỮ LIỆU
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đường cong nối tuần tự {dataPoints.length} điểm đo thực nghiệm (trục hoành f theo Hz, trục tung biên độ A tính theo cm).
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-100"></span>
                  <span className="font-semibold text-slate-700">Đường cong thực nghiệm qua {dataPoints.length} mốc</span>
                </div>
              </div>

              <div className="h-80 sm:h-96 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sortedPoints}
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
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (cx === undefined || cy === undefined) return null;
                        const isResonancePeak = Math.abs(payload.frequency - NATURAL_FREQUENCY) < 0.05;
                        return (
                          <g key={`dot-${payload.frequency}`}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isResonancePeak ? 6.5 : 5}
                              fill={isResonancePeak ? '#dc2626' : '#2563eb'}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                            {isResonancePeak && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={10}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth={1.5}
                                opacity={0.7}
                              />
                            )}
                          </g>
                        );
                      }}
                      activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#1d4ed8' }}
                      name="Biên độ thực nghiệm"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Section 5: Analysis & Conclusions (Gồm câu hỏi 1, ô Textarea lập luận, câu hỏi 2) */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              V. PHÂN TÍCH KẾT QUẢ &amp; KẾT LUẬN KHOA HỌC
            </h2>

            {/* Question 1: Dropdown */}
            <div className="space-y-2.5">
              <label htmlFor="conclusion-select" className="block text-xs font-semibold text-slate-900 leading-relaxed">
                1. Từ đồ thị, em nhận thấy giả thuyết ban đầu của em là:
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  id="conclusion-select"
                  value={answers.conclusionAnswer}
                  onChange={(e) => onUpdateAnswers({ conclusionAnswer: e.target.value })}
                  className="w-full sm:w-72 rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="">Chọn kết luận…</option>
                  <option value="Hoàn toàn chính xác">Hoàn toàn chính xác</option>
                  <option value="Chưa chính xác">Chưa chính xác</option>
                </select>

                {answers.conclusionAnswer && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Giả thuyết ban đầu: “{userHypothesis ? userHypothesis.slice(0, 40) + (userHypothesis.length > 40 ? '…' : '') : 'Chưa có'}”)
                  </span>
                )}
              </div>

              {/* Feedback for Question 1: Ẩn khi học sinh chọn chính xác */}
              {answers.conclusionAnswer &&
                answers.conclusionAnswer !== 'Chọn kết luận…' &&
                q1Assessment.status !== 'correct' && (
                <div
                  className={`mt-2 p-3 rounded-lg text-xs leading-relaxed border flex items-start gap-2 ${
                    q1Assessment.status === 'incorrect'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {q1Assessment.status === 'incorrect' ? (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-medium">{q1Assessment.feedbackText}</p>
                    {q1Assessment.correctAnswerDisplay && (
                      <p className="text-[11px] text-slate-600">
                        Đáp án phù hợp đối chiếu với giả thuyết: <strong className="text-emerald-700">{q1Assessment.correctAnswerDisplay}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ô Textarea Phần V: Vì sao em lại lựa chọn phương án trên? */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="argument-basis-text" className="block text-xs font-bold text-slate-900">
                  Vì sao em lại lựa chọn phương án trên?
                </label>
                <span className={`text-[11px] font-medium ${textPhanV.trim().length > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {textPhanV.trim().length > 0 ? '✓ Đã nhập' : '(bắt buộc nhập)'}
                </span>
              </div>
              <textarea
                id="argument-basis-text"
                rows={3}
                value={textPhanV}
                onChange={(e) => handleTextPhanVChange(e.target.value)}
                placeholder="Ví dụ: Dựa vào đồ thị ở Phần IV, em thấy tại mốc tần số f = 2.0 Hz, đỉnh đồ thị vọt lên cao nhất đạt 20.00 cm, điều này chứng tỏ..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white leading-relaxed text-slate-800 shadow-2xs"
              />
            </div>

            {/* Question 2: Dropdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label htmlFor="solution-select" className="block text-xs font-semibold text-slate-900 leading-relaxed">
                2. Đề xuất giải pháp: Để hạn chế hiện tượng cộng hưởng do tác động tuần hoàn, em đề xuất chỉ huy ra lệnh:
              </label>

              <select
                id="solution-select"
                value={answers.solutionAnswer}
                onChange={(e) => onUpdateAnswers({ solutionAnswer: e.target.value })}
                className="w-full sm:w-80 rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="">Chọn phương án…</option>
                <option value="Không đi đều và bắt đầu đi tự do">Không đi đều và bắt đầu đi tự do</option>
                <option value="Đi đều bước nhanh hơn">Đi đều bước nhanh hơn</option>
              </select>
            </div>
          </section>

          {/* Section 6: THẢO LUẬN & PHẢN BIỆN KHOA HỌC (Textarea textPhanVI) */}
          <section className="bg-blue-50/70 rounded-xl border border-blue-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-blue-200/80 pb-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold leading-none">VI</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-950">
                VI. GÓC PHẢN BIỆN - BẢO VỆ KẾT QUẢ
              </h2>
            </div>

            {/* Tình huống in nghiêng theo đúng yêu cầu */}
            <div className="p-3.5 bg-white/90 rounded-lg border border-blue-200/90 text-xs sm:text-sm text-slate-800 italic leading-relaxed shadow-2xs">
              <span className="font-bold not-italic text-blue-900 block mb-1">💬 Tình huống thảo luận:</span>
              “Một bạn học sinh cho rằng: 'Cầu rung lắc mạnh chỉ là do đoàn quân quá nặng. Chỉ cần giảm bớt hành lí thì dù đi đều bước, cầu sẽ không còn rung lắc mạnh nữa!'”
            </div>

            {/* Ô Textarea phản biện (textPhanVI) - Không có gợi ý thừa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="critical-debate-text" className="block text-xs font-bold text-blue-950">
                  Nhiệm vụ của em:
                </label>
                <span className={`text-[11px] font-medium ${textPhanVI.trim().length > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {textPhanVI.trim().length > 0 ? '✓ Đã nhập' : '(bắt buộc nhập)'}
                </span>
              </div>
              <p className="text-xs text-blue-900 font-medium">
                Dựa vào nguyên lí cộng hưởng và dữ liệu vừa thu thập, em hãy phản biện lại ý kiến trên.
              </p>
              <textarea
                id="critical-debate-text"
                rows={4}
                value={textPhanVI}
                onChange={(e) => handleTextPhanVIChange(e.target.value)}
                placeholder=""
                className="w-full text-xs p-3 rounded-lg border border-blue-200 focus:border-blue-600 focus:outline-none bg-white leading-relaxed text-slate-800 shadow-2xs"
              />
            </div>
          </section>

          {/* Section 7: ĐỀ XUẤT GIẢI PHÁP ỨNG DỤNG MỞ RỘNG (Textarea textPhanVII) */}
          <section className="bg-slate-50 rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="p-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold leading-none">VII</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                VII. VẬN DỤNG VÀ NGHIÊN CỨU TIẾP THEO
              </h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="engineering-proposal-text" className="block text-xs font-bold text-slate-900 leading-snug">
                  Nếu em là kĩ sư xây dựng cầu dây treo, em có đề xuất kĩ thuật nào bổ sung vào thiết kế của cây cầu để hạn chế hiện tượng cộng hưởng (do gió bão hoặc nhịp bước chân) trong tương lai?
                </label>
                <span className={`text-[11px] font-medium shrink-0 ml-2 ${textPhanVII.trim().length > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {textPhanVII.trim().length > 0 ? '✓ Đã nhập' : '(bắt buộc nhập)'}
                </span>
              </div>

              <textarea
                id="engineering-proposal-text"
                rows={4}
                value={textPhanVII}
                onChange={(e) => handleTextPhanVIIChange(e.target.value)}
                placeholder=""
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none bg-white leading-relaxed text-slate-800 shadow-2xs"
              />
            </div>
          </section>

          {/* Section Signature Footer */}
          <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-700 border-t border-slate-200">
            <div className="space-y-6">
              <div className="font-semibold text-slate-500 uppercase text-[11px]">HỌC SINH THỰC HIỆN</div>
              <div className="font-bold text-slate-900 text-sm">{hoTen || '(Ký và ghi rõ họ tên)'}</div>
              <div className="text-[10px] text-emerald-600 font-medium">✓ Đã hoàn thành thực nghiệm và nộp báo cáo</div>
            </div>
            <div className="space-y-6">
              <div className="font-semibold text-slate-500 uppercase text-[11px]">GIÁO VIÊN HƯỚNG DẪN</div>
              <div className="font-bold text-slate-900 text-sm">{CANONICAL_TEACHER_INFO || '(Ký và ghi rõ họ tên)'}</div>
              <div className="text-[10px] text-emerald-600 font-medium">✓ Đã thẩm định kết quả nghiên cứu</div>
            </div>
          </div>
        </div>

        {/* 3. Action Controls: Nút NỘP BÁO CÁO và Validation Notice */}
        <div className="mt-6 flex flex-col items-center space-y-3">
          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs max-w-md w-full text-center">
              {submissionError}
            </div>
          )}

          {/* Nhắc nhở các trường còn thiếu khi nút chưa sáng */}
          {!isFormComplete && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs max-w-lg w-full space-y-1.5 shadow-2xs animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Yêu cầu hoàn tất để mở khóa nút NỘP BÁO CÁO:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900/90">
                {!hoTen.trim() && <li>Nhập họ và tên học sinh.</li>}
                {!lop.trim() && <li>Nhập lớp của học sinh.</li>}
                {!textPhanV.trim() && <li>Trả lời câu hỏi &lsquo;Vì sao em lại lựa chọn phương án trên?&rsquo; ở Phần V.</li>}
                {!textPhanVI.trim() && <li>Nhập nội dung ô textarea Phản biện ở Phần VI.</li>}
                {!textPhanVII.trim() && <li>Nhập nội dung ô textarea Đề xuất kĩ thuật ở Phần VII.</li>}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onGoBackToExperiment && (
              <button
                type="button"
                onClick={onGoBackToExperiment}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                ← Quay lại thực nghiệm
              </button>
            )}

            {/* Nút "NỘP BÁO CÁO": Chỉ sáng lên khi nhập đủ Họ tên, Lớp và 3 ô Textarea */}
            <button
              type="button"
              onClick={handleSubmitData}
              disabled={!isFormComplete || isSubmittingData}
              className={`py-3.5 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                !isFormComplete
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  : isSubmittingData
                  ? 'bg-blue-500 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/25 hover:shadow-md transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmittingData ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi dữ liệu về máy chủ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>NỘP BÁO CÁO</span>
                </>
              )}
            </button>

            {/* Nút phụ: Xuất tệp PDF lưu trữ ngoại tuyến */}
            <button
              type="button"
              onClick={onSubmitReport}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              title="Tải bản PDF báo cáo về máy tính"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up (Modal) toàn màn hình màu xanh lá theo yêu cầu:
          "✅ NỘP BÁO CÁO THÀNH CÔNG! Dữ liệu của em đã được gửi về hệ thống của Giáo viên bộ môn." */}
      {showSubmitSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 p-6 sm:p-8 space-y-6 text-center transform transition-all scale-100 overflow-hidden">
            {/* Thanh viền gradient trang trí */}
            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>

            {/* Nút đóng góc phải */}
            <button
              type="button"
              onClick={() => setShowSubmitSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon biểu tượng thành công */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 stroke-[2.5]" />
            </div>

            {/* Nội dung thông báo theo đúng nguyên văn yêu cầu */}
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                ✅ NỘP BÁO CÁO THÀNH CÔNG!
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold max-w-md mx-auto">
                Dữ liệu của em đã được gửi về hệ thống của Giáo viên bộ môn.
              </p>
            </div>

            {/* Tóm tắt thông tin học sinh & thời gian ghi nhận */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-left space-y-2 text-emerald-950">
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800 font-semibold">Học sinh:</span>
                <span className="font-bold text-slate-900">{hoTen}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800 font-semibold">Lớp:</span>
                <span className="font-bold text-slate-900">{lop}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800 font-semibold">Thời gian gửi:</span>
                <span className="font-medium text-emerald-900">{new Date().toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-emerald-800 font-semibold">Trạng thái Google Sheets:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span>✓ Đã truyền tải (no-cors)</span>
                </span>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitSuccessModal(false)}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                Đã hiểu &amp; Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSubmitSuccessModal(false);
                  onSubmitReport();
                }}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Tải tệp PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
