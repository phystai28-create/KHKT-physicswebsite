import { jsPDF } from 'jspdf';
import { DataPoint, ReportPayload } from '../types/physics';
import {
  NATURAL_FREQUENCY,
  formatVietnameseNumber,
  CANONICAL_TEACHER_INFO,
  SCHOOL_NAME,
  buildAssessmentReport,
} from './physics';

/**
 * Triggers a direct file download using a Blob and anchor element.
 * Works reliably inside browser iframes and across all platforms.
 */
function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Helper to wrap text into multiple lines within a max width
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4
): number {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        line += '...';
        ctx.fillText(line.trim(), x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/**
 * Helper to draw a rounded rectangle
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 1
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Renders an authentic, comprehensive, high-resolution A4 scientific lab report
 * directly onto a 2D canvas with complete Vietnamese unicode support.
 */
export function renderReportCanvas(data: ReportPayload): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // High-resolution A4 canvas: 1240 x 1754 px (150 DPI)
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d')!;

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Top Color Bar
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, canvas.width, 8);

  const leftMargin = 70;
  const contentWidth = 1100;
  const rightEdge = leftMargin + contentWidth;

  // 3. Institution Header
  ctx.font = 'bold 15px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1d4ed8';
  ctx.textAlign = 'left';
  ctx.fillText('TRƯỜNG THPT FPT CẦN THƠ', leftMargin, 36);

  ctx.font = '12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText('DỰ ÁN NGHIÊN CỨU KHOA HỌC • VẬT LÍ 11', rightEdge, 36);

  // Divider
  ctx.beginPath();
  ctx.moveTo(leftMargin, 46);
  ctx.lineTo(rightEdge, 46);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Main Document Titles
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('BÁO CÁO KẾT QUẢ THỰC NGHIỆM VẬT LÍ 11', canvas.width / 2, 78);

  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#2563eb';
  ctx.fillText('CHUYÊN ĐỀ: DAO ĐỘNG CƠ HỌC VÀ HIỆN TƯỢNG CỘNG HƯỞNG', canvas.width / 2, 98);

  ctx.font = 'italic 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Khảo sát hiện tượng dao động của cầu treo khi đoàn quân di chuyển qua', canvas.width / 2, 116);

  // 5. Student Metadata Box (y = 130 to 184)
  const metaY = 130;
  drawRoundRect(ctx, leftMargin, metaY, contentWidth, 54, 8, '#f8fafc', '#cbd5e1', 1);

  ctx.textAlign = 'left';
  ctx.font = '12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  
  // Left col
  const sName = data.studentName?.trim() || 'Học sinh THPT FPT Cần Thơ';
  const sClass = data.studentClass?.trim() || 'Lớp 11';
  ctx.fillText('Họ và tên học sinh:', leftMargin + 20, metaY + 24);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(sName, leftMargin + 145, metaY + 24);

  ctx.font = '12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Lớp:', leftMargin + 20, metaY + 44);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(sClass, leftMargin + 60, metaY + 44);

  // Right col
  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  ctx.font = '12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Ngày lập báo cáo:', leftMargin + 600, metaY + 24);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(todayStr, leftMargin + 725, metaY + 24);

  if (CANONICAL_TEACHER_INFO) {
    ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(CANONICAL_TEACHER_INFO, leftMargin + 600, metaY + 44);
  }

  // 6. Section I: GIẢ THUYẾT BAN ĐẦU (y = 200)
  let curY = 200;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('I. GIẢ THUYẾT BAN ĐẦU CỦA HỌC SINH', leftMargin, curY);

  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Phán đoán ban đầu về nguyên nhân làm nhịp cầu rung lắc dữ dội khi đoàn quân đi đều bước:', leftMargin, curY + 16);

  const hypBoxY = curY + 24;
  const hypBoxH = 50;
  drawRoundRect(ctx, leftMargin, hypBoxY, contentWidth, hypBoxH, 6, '#f1f5f9', '#cbd5e1', 1);

  ctx.font = 'italic 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  wrapCanvasText(
    ctx,
    `“${data.hypothesis || 'Chưa ghi nhận giả thuyết ban đầu.'}”`,
    leftMargin + 16,
    hypBoxY + 22,
    contentWidth - 32,
    18,
    2
  );

  // 7. Section II: KẾ HOẠCH THỰC NGHIỆM (y = 290)
  curY = 290;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('II. THIẾT KẾ KẾ HOẠCH THỰC NGHIỆM & KIỂM SOÁT BIẾN SỐ', leftMargin, curY);

  const planBoxY = curY + 10;
  const planBoxH = 46;
  drawRoundRect(ctx, leftMargin, planBoxY, contentWidth, planBoxH, 6, '#ffffff', '#e2e8f0', 1);

  const cardW = contentWidth / 3;
  // Card 1: Independent
  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Biến độc lập (Chủ động thay đổi):', leftMargin + 16, planBoxY + 18);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText(data.independentVariable || 'Tần số bước chân f (Hz)', leftMargin + 16, planBoxY + 36);

  // Divider 1
  ctx.beginPath();
  ctx.moveTo(leftMargin + cardW, planBoxY + 6);
  ctx.lineTo(leftMargin + cardW, planBoxY + planBoxH - 6);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Card 2: Control
  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Biến kiểm soát (Giữ cố định):', leftMargin + cardW + 16, planBoxY + 18);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(data.controlVariable || 'Khối lượng đoàn quân & Chiều dài cầu', leftMargin + cardW + 16, planBoxY + 36);

  // Divider 2
  ctx.beginPath();
  ctx.moveTo(leftMargin + cardW * 2, planBoxY + 6);
  ctx.lineTo(leftMargin + cardW * 2, planBoxY + planBoxH - 6);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Card 3: Natural Frequency
  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Tần số riêng của nhịp cầu (f₀):', leftMargin + cardW * 2 + 16, planBoxY + 18);
  ctx.font = 'bold 12px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#dc2626';
  ctx.fillText('f₀ = 2,0 Hz', leftMargin + cardW * 2 + 16, planBoxY + 36);

  // 8. Section III: BẢNG SỐ LIỆU THỰC NGHIỆM ĐO ĐƯỢC (y = 362)
  curY = 362;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('III. BẢNG SỐ LIỆU THỰC NGHIỆM ĐO ĐƯỢC', leftMargin, curY);

  const tableY = curY + 10;
  const headerH = 26;
  const rowH = 24;

  // Table header background
  drawRoundRect(ctx, leftMargin, tableY, contentWidth, headerH, 4, '#f1f5f9', '#cbd5e1', 1);

  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.fillText('Lần đo', leftMargin + 40, tableY + 17);

  ctx.textAlign = 'left';
  ctx.fillText('Tần số bước chân f (Hz)', leftMargin + 100, tableY + 17);
  ctx.fillText('Biên độ dao động mô phỏng A (cm)', leftMargin + 350, tableY + 17);
  ctx.fillText('Hiện tượng & Trạng thái dao động', leftMargin + 640, tableY + 17);

  const measurements = data.measurements || [];
  const displayRows = measurements.slice(0, 8); // Display up to 8 rows comfortably

  displayRows.forEach((dp, idx) => {
    const yRow = tableY + headerH + idx * rowH;
    const isPeak = Math.abs(dp.frequency - NATURAL_FREQUENCY) < 0.05;

    // Row background
    if (isPeak) {
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(leftMargin, yRow, contentWidth, rowH);
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1;
      ctx.strokeRect(leftMargin, yRow, contentWidth, rowH);
    } else if (idx % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(leftMargin, yRow, contentWidth, rowH);
    }

    // Border line bottom
    ctx.beginPath();
    ctx.moveTo(leftMargin, yRow + rowH);
    ctx.lineTo(rightEdge, yRow + rowH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Data text
    ctx.textAlign = 'center';
    ctx.font = isPeak
      ? 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      : '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = isPeak ? '#991b1b' : '#64748b';
    ctx.fillText(`${idx + 1}`, leftMargin + 40, yRow + 15);

    ctx.textAlign = 'left';
    ctx.font = isPeak
      ? 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      : '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = isPeak ? '#991b1b' : '#0f172a';
    ctx.fillText(`${formatVietnameseNumber(dp.frequency, 2)} Hz`, leftMargin + 100, yRow + 15);
    ctx.fillText(`${formatVietnameseNumber(dp.amplitude, 2)} cm`, leftMargin + 350, yRow + 15);

    if (isPeak) {
      ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('★ CỰC ĐẠI CỘNG HƯỞNG (A đạt đỉnh lớn nhất)', leftMargin + 640, yRow + 15);
    } else if (dp.amplitude > 40) {
      ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText('Biên độ dao động tăng rõ rệt (gần vùng cộng hưởng)', leftMargin + 640, yRow + 15);
    } else {
      ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Biên độ dao động nhỏ (an toàn)', leftMargin + 640, yRow + 15);
    }
  });

  // Table outer border
  const tableTotalH = headerH + displayRows.length * rowH;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftMargin, tableY, contentWidth, tableTotalH);

  // 9. Section IV: ĐỒ THỊ BIÊN ĐỘ THEO TẦN SỐ (y ~ 575)
  curY = tableY + tableTotalH + 18;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('IV. ĐỒ THỊ BIỂU DIỄN BIÊN ĐỘ THEO TẦN SỐ', leftMargin, curY);

  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Đáp ứng biên độ dao động phi tuyến khi tần số ngoại lực tiến dần tới tần số dao động riêng f₀ = 2,0 Hz:', leftMargin, curY + 16);

  const graphBoxY = curY + 22;
  const graphBoxH = 220;
  drawRoundRect(ctx, leftMargin, graphBoxY, contentWidth, graphBoxH, 8, '#ffffff', '#cbd5e1', 1);

  // Plot coordinates inside graphBox
  const plotLeft = leftMargin + 70;
  const plotTop = graphBoxY + 30;
  const plotW = contentWidth - 110;
  const plotH = 145;
  const plotBottom = plotTop + plotH;

  const minF = 0.5;
  const maxF = 4.0;
  const minA = 0;
  const maxA = 120;

  const getPx = (f: number) => plotLeft + ((f - minF) / (maxF - minF)) * plotW;
  const getPy = (a: number) => plotBottom - ((a - minA) / (maxA - minA)) * plotH;

  // Horizontal Grid Lines & Y Labels
  const yTicks = [0, 20, 40, 60, 80, 100, 120];
  ctx.textAlign = 'right';
  ctx.font = '10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  yTicks.forEach((yVal) => {
    const py = getPy(yVal);
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${yVal}`, plotLeft - 10, py + 3.5);

    ctx.beginPath();
    ctx.moveTo(plotLeft, py);
    ctx.lineTo(plotLeft + plotW, py);
    ctx.strokeStyle = yVal === 0 ? '#94a3b8' : '#f1f5f9';
    ctx.lineWidth = yVal === 0 ? 1.5 : 1;
    ctx.stroke();
  });

  // Vertical Grid Lines & X Labels
  const xTicks = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  ctx.textAlign = 'center';
  xTicks.forEach((xVal) => {
    const px = getPx(xVal);
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${formatVietnameseNumber(xVal, 1)}`, px, plotBottom + 16);

    ctx.beginPath();
    ctx.moveTo(px, plotTop);
    ctx.lineTo(px, plotBottom);
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Axis tick notch
    ctx.beginPath();
    ctx.moveTo(px, plotBottom);
    ctx.lineTo(px, plotBottom + 4);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Axis Titles
  ctx.font = 'bold 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'right';
  ctx.fillText('Tần số ngoại lực f (Hz) →', plotLeft + plotW, plotBottom + 28);

  ctx.textAlign = 'left';
  ctx.fillText('↑ Biên độ A', plotLeft - 30, plotTop - 12);

  // Theoretical Reference Curve (dashed gray)
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  let firstPoint = true;
  for (let fStep = minF; fStep <= maxF; fStep += 0.05) {
    const theoA = 10 + 100 / (1 + 10 * Math.abs(fStep - NATURAL_FREQUENCY));
    const px = getPx(fStep);
    const py = getPy(theoA);
    if (firstPoint) {
      ctx.moveTo(px, py);
      firstPoint = false;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Vertical Red Reference Line at Resonance f0 = 2.0 Hz
  const pxResonance = getPx(NATURAL_FREQUENCY);
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.moveTo(pxResonance, plotTop - 5);
  ctx.lineTo(pxResonance, plotBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label at resonance vertical line top
  ctx.font = 'bold 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.fillText('f₀ = 2,0 Hz (Tần số riêng)', pxResonance, plotTop - 10);

  // Plotted Experimental Line connecting measured points
  const sortedPoints = [...measurements].sort((a, b) => a.frequency - b.frequency);
  if (sortedPoints.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    sortedPoints.forEach((pt, i) => {
      const px = getPx(pt.frequency);
      const py = getPy(pt.amplitude);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  // Draw Dots for each measured point
  sortedPoints.forEach((pt) => {
    const px = getPx(pt.frequency);
    const py = getPy(pt.amplitude);
    const isPeak = Math.abs(pt.frequency - NATURAL_FREQUENCY) < 0.05;

    if (isPeak) {
      // Highlighted Peak
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Peak Badge Callout
      drawRoundRect(ctx, px - 75, py - 28, 150, 20, 4, '#dc2626', '#991b1b', 1);
      ctx.font = 'bold 9px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Cực đại: A = 110 tại f = 2,0 Hz', px, py - 14);
    } else {
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  });

  // Graph Legend in Top Right
  const legX = plotLeft + plotW - 270;
  const legY = graphBoxY + 12;
  drawRoundRect(ctx, legX, legY, 260, 22, 4, '#f8fafc', '#e2e8f0', 1);

  // Legend 1: Points
  ctx.beginPath();
  ctx.arc(legX + 16, legY + 11, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  ctx.font = '10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText('Điểm thực nghiệm', legX + 26, legY + 14);

  // Legend 2: Theory
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(legX + 130, legY + 11);
  ctx.lineTo(legX + 155, legY + 11);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText('Đường lý thuyết', legX + 162, legY + 14);

  // 10. Section V: PHÂN TÍCH VÀ KẾT LUẬN
  curY = graphBoxY + graphBoxH + 18;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('V. PHÂN TÍCH KẾT QUẢ & KẾT LUẬN KHOA HỌC', leftMargin, curY);

  // Compute unified assessment
  const assessment =
    data.assessment ||
    buildAssessmentReport(
      {
        conclusionAnswer: data.conclusionAnswer,
        solutionAnswer: data.solutionAnswer,
        reflection: data.reflection,
        studentName: data.studentName,
        studentClass: data.studentClass,
      },
      data.hypothesis
    );

  // Question 1 Block
  const q1IsIncorrect = assessment.q1.status === 'incorrect';
  const q1BoxH = q1IsIncorrect ? 74 : 58;
  const q1BoxY = curY + 10;
  drawRoundRect(ctx, leftMargin, q1BoxY, contentWidth, q1BoxH, 6, '#f8fafc', '#e2e8f0', 1);

  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(
    '1. Đánh giá tính chính xác của giả thuyết ban đầu:',
    leftMargin + 16,
    q1BoxY + 18
  );

  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    'Từ đồ thị, em nhận thấy giả thuyết ban đầu của em là:',
    leftMargin + 16,
    q1BoxY + 34
  );

  const conclAns = data.conclusionAnswer || 'Chưa chọn kết luận';
  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e40af';
  ctx.fillText(`“${conclAns}”`, leftMargin + 480, q1BoxY + 34);

  // Evaluation Status Line for Question 1
  const nextQ1LineY = q1BoxY + 50;
  if (assessment.q1.status === 'correct') {
    ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#15803d'; // Green
    ctx.fillText('✓ ĐÚNG — Em đã đánh giá phù hợp giả thuyết ban đầu.', leftMargin + 16, nextQ1LineY);
  } else if (assessment.q1.status === 'incorrect') {
    ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#b91c1c'; // Red
    ctx.fillText('✗ SAI — Đáp án của em chưa phù hợp với kết quả thực nghiệm.', leftMargin + 16, nextQ1LineY);
  } else {
    ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Chưa chọn kết luận.', leftMargin + 16, nextQ1LineY);
  }

  // Question 2 Block
  const q2IsIncorrect = assessment.q2.status === 'incorrect';
  const q2BoxH = q2IsIncorrect ? 68 : 56;
  const q2BoxY = q1BoxY + q1BoxH + 6;
  drawRoundRect(ctx, leftMargin, q2BoxY, contentWidth, q2BoxH, 6, '#f8fafc', '#e2e8f0', 1);

  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(
    '2. Đề xuất giải pháp an toàn cho người chỉ huy khi qua cầu treo:',
    leftMargin + 16,
    q2BoxY + 18
  );

  ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Phương án học sinh lựa chọn:', leftMargin + 16, q2BoxY + 33);

  const solAns = data.solutionAnswer || 'Chưa chọn phương án';
  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e40af';
  ctx.fillText(`“${solAns}”`, leftMargin + 185, q2BoxY + 33);

  // Evaluation Status Line for Question 2
  if (data.solutionAnswer === 'Không đi đều và bắt đầu đi tự do') {
    ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#15803d'; // Green
    ctx.fillText(
      '✓ ĐÚNG — Phương án phù hợp với nguyên lí giảm tác động tuần hoàn đồng bộ trong mô hình.',
      leftMargin + 16,
      q2BoxY + 48
    );
  } else if (data.solutionAnswer === 'Đi đều bước nhanh hơn') {
    ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#b91c1c'; // Red
    ctx.fillText(
      '✗ SAI — Đáp án đúng: Không đi đều và bắt đầu đi tự do.',
      leftMargin + 16,
      q2BoxY + 48
    );
  } else {
    ctx.font = '11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Chưa chọn phương án.', leftMargin + 16, q2BoxY + 48);
  }

  // Section VI Block: THẢO LUẬN & PHẢN BIỆN KHOA HỌC
  const sec6Y = q2BoxY + q2BoxH + 12;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('VI. GÓC PHẢN BIỆN - BẢO VỆ KẾT QUẢ', leftMargin, sec6Y);

  const sec6BoxY = sec6Y + 8;
  const sec6BoxH = 76;
  drawRoundRect(ctx, leftMargin, sec6BoxY, contentWidth, sec6BoxH, 6, '#eff6ff', '#bfdbfe', 1);

  ctx.font = 'italic 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  wrapCanvasText(
    ctx,
    '💬 Tình huống: “Một bạn học sinh cho rằng: \'Cầu rung lắc mạnh chỉ là do đoàn quân quá nặng. Chỉ cần giảm bớt hành lí thì dù đi đều bước, cầu sẽ không còn rung lắc mạnh nữa!\'”',
    leftMargin + 16,
    sec6BoxY + 16,
    contentWidth - 32,
    13,
    2
  );

  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Lập luận phản biện của học sinh:', leftMargin + 16, sec6BoxY + 46);

  ctx.font = 'italic 10.5px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  wrapCanvasText(
    ctx,
    `“${data.criticalDebate?.trim() || 'Chưa nhập phản biện.'}”`,
    leftMargin + 16,
    sec6BoxY + 60,
    contentWidth - 32,
    14,
    2
  );

  // Section VII Block: ĐỀ XUẤT GIẢI PHÁP ỨNG DỤNG MỞ RỘNG
  const sec7Y = sec6BoxY + sec6BoxH + 12;
  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('VII. VẬN DỤNG VÀ NGHIÊN CỨU TIẾP THEO', leftMargin, sec7Y);

  const sec7BoxY = sec7Y + 8;
  const sec7BoxH = 76;
  drawRoundRect(ctx, leftMargin, sec7BoxY, contentWidth, sec7BoxH, 6, '#f8fafc', '#e2e8f0', 1);

  ctx.font = 'bold 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  wrapCanvasText(
    ctx,
    'Nếu em là kĩ sư xây dựng cầu dây treo, em có đề xuất kĩ thuật nào bổ sung vào thiết kế của cây cầu để hạn chế hiện tượng cộng hưởng (do gió bão hoặc nhịp bước chân) trong tương lai?',
    leftMargin + 16,
    sec7BoxY + 16,
    contentWidth - 32,
    13,
    2
  );

  ctx.font = 'italic 10.5px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#1e293b';
  wrapCanvasText(
    ctx,
    `“${data.engineeringProposal?.trim() || 'Chưa nhập đề xuất kĩ thuật.'}”`,
    leftMargin + 16,
    sec7BoxY + 50,
    contentWidth - 32,
    14,
    2
  );

  // Signatures & Validation
  const sigY = sec7BoxY + sec7BoxH + 20;
  ctx.beginPath();
  ctx.moveTo(leftMargin, sigY);
  ctx.lineTo(rightEdge, sigY);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left: Student signature
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('HỌC SINH THỰC HIỆN', leftMargin + 240, sigY + 22);

  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(sName, leftMargin + 240, sigY + 50);

  ctx.font = 'italic 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#16a34a';
  ctx.fillText('✓ Đã hoàn thành thực nghiệm và nộp báo cáo', leftMargin + 240, sigY + 66);

  // Right: Teacher signature
  ctx.font = 'bold 11px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('GIÁO VIÊN HƯỚNG DẪN', rightEdge - 240, sigY + 22);

  ctx.font = 'bold 13px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(CANONICAL_TEACHER_INFO || '(Ký và ghi rõ họ tên)', rightEdge - 240, sigY + 50);

  ctx.font = 'italic 10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#16a34a';
  ctx.fillText('✓ Đã thẩm định kết quả nghiên cứu', rightEdge - 240, sigY + 66);

  // Bottom Footer
  ctx.beginPath();
  ctx.moveTo(leftMargin, 1715);
  ctx.lineTo(rightEdge, 1715);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.font = '10px "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Báo cáo nghiên cứu khoa học Vật lí 11 • Khảo sát mô hình hiện tượng cộng hưởng cơ học',
    canvas.width / 2,
    1735
  );

  return canvas;
}

/**
 * Generates an A4 PDF containing the complete, detailed laboratory report
 * and triggers an automatic download for the student.
 */
export async function generateReportPDF(
  _elementId: string,
  data: ReportPayload,
  fileName: string = 'Bao_cao_thi_nghiem_cong_huong_Vat_li_11.pdf'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Render the high-resolution, pixel-perfect A4 report on canvas
    const canvas = renderReportCanvas(data);

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Initialize jsPDF in A4 portrait (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // Embed the canvas image to fill the entire A4 page with high fidelity
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    // Trigger automatic direct browser file download
    const pdfBlob = pdf.output('blob');
    triggerFileDownload(pdfBlob, fileName);

    // Also call pdf.save() for maximum browser compatibility
    try {
      pdf.save(fileName);
    } catch {
      // Ignored if direct blob download already succeeded
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('PDF Generation Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tạo tệp PDF';
    return { success: false, error: errorMessage };
  }
}
