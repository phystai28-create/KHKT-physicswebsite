import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { DataPoint } from '../types/physics';
import { NATURAL_FREQUENCY, formatVietnameseNumber } from '../utils/physics';

interface ResonanceChartProps {
  dataPoints: DataPoint[];
  showTheoreticalCurve?: boolean;
}

export const ResonanceChart: React.FC<ResonanceChartProps> = ({
  dataPoints,
  showTheoreticalCurve = true,
}) => {
  // Sort recorded points by frequency to draw a clean empirical curve
  const sortedRecorded = [...dataPoints].sort((a, b) => a.frequency - b.frequency);

  // Generate continuous theoretical model data points for reference if enabled
  // A = 10 + 100 / (1 + 10 * |f - 2.0|)
  const theoreticalPoints = [];
  for (let f = 0.5; f <= 4.05; f += 0.1) {
    const fRound = Math.round(f * 10) / 10;
    const theoreticalA = Math.round((10 + 100 / (1 + 10 * Math.abs(fRound - NATURAL_FREQUENCY))) * 10) / 10;

    // Check if student measured this point
    const recordedMatch = dataPoints.find((dp) => Math.abs(dp.frequency - fRound) < 0.05);

    theoreticalPoints.push({
      frequency: fRound,
      theoreticalAmplitude: theoreticalA,
      recordedAmplitude: recordedMatch ? recordedMatch.amplitude : null,
      isPeak: Math.abs(fRound - NATURAL_FREQUENCY) < 0.05 && !!recordedMatch,
    });
  }

  // Find max recorded
  const maxRecorded = dataPoints.reduce<DataPoint | null>((max, p) => {
    if (!max || p.amplitude > max.amplitude) return p;
    return max;
  }, null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            ĐỒ THỊ BIÊN ĐỘ THEO TẦN SỐ
          </h3>
          <p className="text-[11px] text-slate-500">
            Khảo sát quan hệ giữa tần số kích thích f (Hz) và biên độ dao động A
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-100"></span>
            <span className="font-semibold text-slate-700">Điểm đo thực nghiệm ({dataPoints.length})</span>
          </div>
          {showTheoreticalCurve && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-300 border-t border-dashed border-slate-400"></span>
              <span className="text-slate-500">Đường lý thuyết</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full pt-1">
        {sortedRecorded.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 font-bold text-sm">
              f, A
            </div>
            <p className="text-xs font-semibold text-slate-700">Chưa có điểm thực nghiệm nào được ghi nhận</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Hãy điều chỉnh thanh trượt tần số và nhấn <strong className="text-blue-700">“Ghi nhận số liệu”</strong> để vẽ đồ thị.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={theoreticalPoints}
              margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="frequency"
                type="number"
                domain={[0.5, 4.0]}
                ticks={[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
                tickFormatter={(val) => formatVietnameseNumber(val)}
                label={{
                  value: 'Tần số ngoại lực f (Hz)',
                  position: 'insideBottom',
                  offset: -12,
                  style: { fontSize: 11, fill: '#64748b' },
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                domain={[0, 120]}
                ticks={[0, 20, 40, 60, 80, 100, 120]}
                label={{
                  value: 'Biên độ A',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { fontSize: 11, fill: '#64748b' },
                }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                        <div className="font-bold text-cyan-300">
                          f = {formatVietnameseNumber(data.frequency, 2)} Hz
                        </div>
                        {data.recordedAmplitude !== null ? (
                          <div className="text-emerald-300 font-semibold">
                            Biên độ đo được: {formatVietnameseNumber(data.recordedAmplitude, 2)} cm
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">Chưa đo tại tần số này</div>
                        )}
                        <div className="text-slate-400 text-[10px]">
                          Lý thuyết: {formatVietnameseNumber(data.theoreticalAmplitude, 2)} cm
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Reference vertical line at natural frequency 2.0 Hz */}
              <ReferenceLine
                x={NATURAL_FREQUENCY}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'f₀ = 2,0 Hz (Tần số riêng)',
                  position: 'insideTopRight',
                  fill: '#dc2626',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Theoretical curve for subtle comparison */}
              {showTheoreticalCurve && (
                <Line
                  type="monotone"
                  dataKey="theoreticalAmplitude"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Đường lý thuyết"
                  isAnimationActive={false}
                />
              )}

              {/* Actual recorded data points */}
              <Line
                type="monotone"
                dataKey="recordedAmplitude"
                stroke="#2563eb"
                strokeWidth={3}
                connectNulls={true}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.recordedAmplitude === null || cx === undefined || cy === undefined) {
                    return null;
                  }
                  const isResonancePeak = Math.abs(payload.frequency - NATURAL_FREQUENCY) < 0.05;

                  return (
                    <g key={`dot-${payload.frequency}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isResonancePeak ? 7 : 5}
                        fill={isResonancePeak ? '#dc2626' : '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      {isResonancePeak && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={11}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          className="animate-ping"
                          opacity={0.7}
                        />
                      )}
                    </g>
                  );
                }}
                activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#1d4ed8' }}
                name="Thực nghiệm"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart footer insights */}
      {maxRecorded && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between text-slate-700">
          <div>
            Biên độ đo cao nhất: <strong className="text-red-600 font-bold">{formatVietnameseNumber(maxRecorded.amplitude)}</strong> tại{' '}
            <strong className="text-slate-900 font-bold">{formatVietnameseNumber(maxRecorded.frequency)} Hz</strong>
          </div>
          {Math.abs(maxRecorded.frequency - NATURAL_FREQUENCY) < 0.05 ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              ✓ Đã ghi nhận điểm cực đại tại tần số riêng f₀
            </span>
          ) : (
            <span className="text-amber-700 font-medium">
              Chưa đo tại tần số riêng 2,0 Hz
            </span>
          )}
        </div>
      )}
    </div>
  );
};
