import React from 'react';
import { DataPoint } from '../types/physics';
import { NATURAL_FREQUENCY, formatVietnameseNumber } from '../utils/physics';
import { Trash2 } from 'lucide-react';

interface DataTableProps {
  dataPoints: DataPoint[];
  onRemovePoint: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ dataPoints, onRemovePoint }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          BẢNG SỐ LIỆU ĐÃ GHI NHẬN
        </h4>
        <span className="text-xs text-slate-500 font-medium">
          {dataPoints.length} lần đo
        </span>
      </div>

      <div className="overflow-x-auto max-h-52 border border-slate-200 rounded-lg">
        {dataPoints.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            Chưa có số liệu thực nghiệm. Hãy điều chỉnh tần số và nhấn <strong className="text-blue-600">“Ghi nhận số liệu”</strong>.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 text-center w-16">Lần đo</th>
                <th className="py-2 px-3">Tần số f (Hz)</th>
                <th className="py-2 px-3">Biên độ A (cm)</th>
                <th className="py-2 px-3">Hiện tượng</th>
                <th className="py-2 px-3 text-center w-12">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {dataPoints.map((dp, index) => {
                const isPeak = Math.abs(dp.frequency - NATURAL_FREQUENCY) < 0.05;

                return (
                  <tr
                    key={dp.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isPeak ? 'bg-red-50/60 font-semibold text-red-950' : 'text-slate-700'
                    }`}
                  >
                    <td className="py-2 px-3 text-center text-slate-500">{index + 1}</td>
                    <td className="py-2 px-3">{formatVietnameseNumber(dp.frequency, 2)} Hz</td>
                    <td className="py-2 px-3">
                      <span className={isPeak ? 'text-red-700 font-bold' : ''}>
                        {formatVietnameseNumber(dp.amplitude, 2)} cm
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-600">
                      {isPeak ? (
                        <span className="text-red-600 font-semibold">Cực đại cộng hưởng</span>
                      ) : dp.amplitude > 40 ? (
                        <span className="text-amber-700">Biên độ tăng rõ</span>
                      ) : (
                        <span className="text-slate-500">Biên độ nhỏ</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemovePoint(dp.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Xóa điểm đo này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
