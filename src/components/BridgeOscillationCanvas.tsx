import React, { useEffect, useRef, useState } from 'react';
import { NATURAL_FREQUENCY, formatVietnameseNumber } from '../utils/physics';
import { Maximize2, Minimize2, Activity } from 'lucide-react';

interface BridgeOscillationCanvasProps {
  frequency: number;
  amplitude: number;
}

export const BridgeOscillationCanvas: React.FC<BridgeOscillationCanvasProps> = ({
  frequency,
  amplitude,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Marching soldiers state (matching Module 1 soldiers platoon)
  const soldiersRef = useRef<Array<{ x: number }>>([
    { x: 60 },
    { x: 94 },
    { x: 128 },
    { x: 162 },
    { x: 196 },
    { x: 230 },
    { x: 264 },
    { x: 298 },
  ]);

  // Toggle fullscreen
  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch {
          setIsFullscreen(true);
        }
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore
        }
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      // Dynamic dimensions based on container
      const containerWidth = containerRef.current?.clientWidth || 640;
      const targetWidth = isFullscreen ? Math.min(1200, containerWidth - 32) : 640;
      const targetHeight = isFullscreen ? Math.min(600, window.innerHeight - 180) : 230;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with crisp clean background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Draw faint engineering grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Time progression based on input forcing frequency
      // Angular velocity omega = 2 * PI * f
      phase += 0.045 * frequency;

      // RAISED BRIDGE DECK: Deck baseline is at ~48% height
      const baselineY = height * 0.48;
      const tower1X = width * 0.16;
      const tower2X = width * 0.84;
      const towerTopY = height * 0.10;
      const towerH = baselineY - towerTopY;

      // River surface safely below the deck (clearance > 80px)
      const waterLevelY = height * 0.76;

      // Draw River Water with waves & depth
      ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.fillRect(0, waterLevelY, width, height - waterLevelY);

      ctx.fillStyle = 'rgba(186, 230, 253, 0.5)';
      ctx.fillRect(0, waterLevelY + 14, width, height - (waterLevelY + 14));

      // Water surface wave lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 15) {
        const waveY = waterLevelY + Math.sin(x * 0.03 + phase * 0.6) * 2.5;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();

      // Shoreline Abutments
      const startDeckX = width * 0.05;
      const endDeckX = width * 0.95;
      const span = endDeckX - startDeckX;

      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;

      // Left abutment
      ctx.beginPath();
      ctx.moveTo(0, baselineY - 3);
      ctx.lineTo(startDeckX + 10, baselineY - 3);
      ctx.lineTo(startDeckX + 2, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right abutment
      ctx.beginPath();
      ctx.moveTo(endDeckX - 10, baselineY - 3);
      ctx.lineTo(width, baselineY - 3);
      ctx.lineTo(width, height);
      ctx.lineTo(endDeckX - 2, height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Concrete Pier Foundations under towers
      const pierWidth = 24;
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;

      // Left pier
      ctx.fillRect(tower1X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6));
      ctx.strokeRect(tower1X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6));

      // Right pier
      ctx.fillRect(tower2X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6));
      ctx.strokeRect(tower2X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6));

      // Map model amplitude (0 to 100 cm) to visual pixel displacement (2 to 24px)
      const visualAmplitude = 2 + (amplitude / 100) * 22;

      // Draw Towers
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#cbd5e1';

      // Left tower
      ctx.fillRect(tower1X - 8, towerTopY, 16, towerH + 12);
      ctx.strokeRect(tower1X - 8, towerTopY, 16, towerH + 12);

      // Right tower
      ctx.fillRect(tower2X - 8, towerTopY, 16, towerH + 12);
      ctx.strokeRect(tower2X - 8, towerTopY, 16, towerH + 12);

      // Tower cross-bracing
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      for (let b = 0; b < 3; b++) {
        const y1 = towerTopY + (b / 3) * (towerH + 8);
        const y2 = towerTopY + ((b + 1) / 3) * (towerH + 8);
        ctx.beginPath();
        ctx.moveTo(tower1X - 8, y1);
        ctx.lineTo(tower1X + 8, y2);
        ctx.moveTo(tower1X + 8, y1);
        ctx.lineTo(tower1X - 8, y2);
        ctx.moveTo(tower2X - 8, y1);
        ctx.lineTo(tower2X + 8, y2);
        ctx.moveTo(tower2X + 8, y1);
        ctx.lineTo(tower2X - 8, y2);
        ctx.stroke();
      }

      // Maximum static sag of suspension cable
      const minSagClearance = Math.max(34, height * 0.10);
      const maxSag = Math.max(20, baselineY - towerTopY - minSagClearance);

      // REQUIREMENT 1: SYNCHRONIZED OSCILLATION OF SUSPENSION SYSTEM (MAIN CABLE & DECK)
      const getDynamicCableY = (x: number): number => {
        if (x >= tower1X && x <= tower2X) {
          const normT = (x - tower1X) / (tower2X - tower1X);
          const staticSag = 4 * normT * (1 - normT) * maxSag;
          const cableEnvelope = Math.sin(normT * Math.PI);
          const cableDy = visualAmplitude * cableEnvelope * Math.sin(phase) * 0.75;
          return towerTopY + staticSag + cableDy;
        } else if (x < tower1X) {
          const normBack = (x - (startDeckX - 8)) / (tower1X - (startDeckX - 8));
          return (baselineY + 8) + normBack * (towerTopY - (baselineY + 8));
        } else {
          const normBack = (x - tower2X) / ((endDeckX + 8) - tower2X);
          return towerTopY + normBack * ((baselineY + 8) - towerTopY);
        }
      };

      // Draw Main Dynamic Suspension Cables
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startDeckX - 8, baselineY + 8);
      ctx.lineTo(tower1X, towerTopY);

      // Dynamic curve between towers
      for (let x = tower1X; x <= tower2X; x += 4) {
        ctx.lineTo(x, getDynamicCableY(x));
      }
      ctx.lineTo(tower2X, towerTopY);
      ctx.lineTo(endDeckX + 8, baselineY + 8);
      ctx.stroke();

      // Highlight on dynamic main cable
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = tower1X; x <= tower2X; x += 8) {
        const y = getDynamicCableY(x) - 0.5;
        if (x === tower1X) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Calculate bridge deck curve with standing wave oscillation
      const numPoints = 80;
      const deckPoints: { x: number; y: number }[] = [];
      for (let i = 0; i <= numPoints; i++) {
        const x = startDeckX + (i / numPoints) * span;
        const normD = (x - startDeckX) / span;
        const envelope = Math.sin(normD * Math.PI);
        const dy = visualAmplitude * envelope * Math.sin(phase);
        const deckY = baselineY + dy;
        deckPoints.push({ x, y: deckY });
      }

      // Vertical suspension hangers connecting cable and deck
      const hangerSpacing = 18;
      for (let x = tower1X + 16; x < tower2X; x += hangerSpacing) {
        const cableY = getDynamicCableY(x);
        const normD = (x - startDeckX) / span;
        const dy = visualAmplitude * Math.sin(normD * Math.PI) * Math.sin(phase);
        const deckY = baselineY + dy;

        // Top clamp on cable
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(x, cableY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Vertical elastic hanger line
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, cableY);
        ctx.lineTo(x, deckY);
        ctx.stroke();

        // Bottom clamp on deck
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.arc(x, deckY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Lower Truss
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.5;
      const trussH = 10;
      for (let i = 0; i < deckPoints.length - 2; i += 2) {
        const p1 = deckPoints[i];
        const p2 = deckPoints[i + 2];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y + trussH);
        ctx.lineTo(p1.x, p1.y + trussH);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Base beam
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let i = 0; i < deckPoints.length; i++) {
        if (i === 0) ctx.moveTo(deckPoints[i].x, deckPoints[i].y + 2);
        else ctx.lineTo(deckPoints[i].x, deckPoints[i].y + 2);
      }
      ctx.stroke();

      // Top vibrant ORANGE deck surface (Mặt sàn cầu đường màu cam)
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      for (let i = 0; i < deckPoints.length; i++) {
        if (i === 0) ctx.moveTo(deckPoints[i].x, deckPoints[i].y);
        else ctx.lineTo(deckPoints[i].x, deckPoints[i].y);
      }
      ctx.stroke();

      // Deck center white traffic dashed line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i < deckPoints.length; i++) {
        if (i === 0) ctx.moveTo(deckPoints[i].x, deckPoints[i].y);
        else ctx.lineTo(deckPoints[i].x, deckPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // -------------------------------------------------------------
      // REQUIREMENT 2: SOLDIERS MARCHING ANIMATION MATCHING MODULE 1
      // (Đoàn quân bước đi sinh động y như ở mục 1 lúc ban đầu)
      // -------------------------------------------------------------
      const marchSpeed = 0.38 + 0.05 * Math.min(frequency, 4);
      for (const s of soldiersRef.current) {
        s.x += marchSpeed;
        if (s.x > endDeckX - 16) {
          s.x = startDeckX + 16;
        }
      }

      // Synchronized marching cadence for the platoon based on excitation frequency f
      const marchCadence = phase * 2;
      const isFootImpact = Math.sin(marchCadence) < -0.7;

      for (let idx = 0; idx < soldiersRef.current.length; idx++) {
        const s = soldiersRef.current[idx];

        // Exact Deck Y at soldier's current position on the orange deck
        const normDeck = (s.x - startDeckX) / span;
        const envelope = Math.sin(Math.max(0, Math.min(1, normDeck)) * Math.PI);
        const deckYAtSoldier = baselineY + visualAmplitude * envelope * Math.sin(phase);

        // Marching kinematics matching Module 1 exactly
        const leftLegSwing = Math.sin(marchCadence) * 8.5;
        const rightLegSwing = -Math.sin(marchCadence) * 8.5;
        const leftKneeLift = Math.max(0, Math.sin(marchCadence)) * 4.5;
        const rightKneeLift = Math.max(0, -Math.sin(marchCadence)) * 4.5;
        const stepLift = Math.abs(Math.sin(marchCadence)) * 4.0;
        const armSwing = Math.sin(marchCadence) * 6.5;

        const soldierY = deckYAtSoldier - 17 - stepLift;

        ctx.save();
        ctx.translate(s.x, soldierY);

        // Head & Beret (Mũ nồi đỏ quân đội)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, -12, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-5, -15, 10, 3.5);

        // Torso / Body (Thân người)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 6);
        ctx.stroke();

        // Field Backpack (Ba lô)
        ctx.fillStyle = '#475569';
        ctx.fillRect(-6, -6, 5, 8);

        // Arms swinging (Hai cánh tay vung theo nhịp bước)
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(armSwing * 0.8, 3);
        ctx.moveTo(0, -4);
        ctx.lineTo(-armSwing * 0.8, 3);
        ctx.stroke();

        // Left Leg: Hip -> Knee -> Foot with boot
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.4;
        const leftKneeX = -2 + leftLegSwing * 0.6;
        const leftKneeY = 13 - leftKneeLift;
        const leftFootX = -2 + leftLegSwing;
        const leftFootY = 20;
        ctx.beginPath();
        ctx.moveTo(-2, 6);
        ctx.lineTo(leftKneeX, leftKneeY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(leftFootX, leftFootY);
        ctx.lineTo(leftFootX + 3.5, leftFootY);
        ctx.stroke();

        // Right Leg: Hip -> Knee -> Foot with boot
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.4;
        const rightKneeX = 2 + rightLegSwing * 0.6;
        const rightKneeY = 13 - rightKneeLift;
        const rightFootX = 2 + rightLegSwing;
        const rightFootY = 20;
        ctx.beginPath();
        ctx.moveTo(2, 6);
        ctx.lineTo(rightKneeX, rightKneeY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(rightFootX, rightFootY);
        ctx.lineTo(rightFootX + 3.5, rightFootY);
        ctx.stroke();

        // Downward Impact Vector & Expanding Shockwave Ripple (Mũi tên lực & sóng xung kích dậm chân cắm vào mặt sàn cầu)
        if (isFootImpact) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.lineTo(0, 30);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(0, 31);
          ctx.lineTo(-3.5, 27);
          ctx.lineTo(3.5, 27);
          ctx.closePath();
          ctx.fill();

          // Expanding shock ripple on deck surface (vòng tròn sóng xung kích dậm chân giống hệt mục 1)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 21 + stepLift, 15, 4.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Force label directly above the center of the marching platoon
      const sortedX = soldiersRef.current.map((s) => s.x).sort((a, b) => a - b);
      const platoonMidX = (sortedX[0] + sortedX[sortedX.length - 1]) / 2;
      const normMid = (platoonMidX - startDeckX) / span;
      const platoonMidY = baselineY + visualAmplitude * Math.sin(Math.max(0, Math.min(1, normMid)) * Math.PI) * Math.sin(phase);

      const tagText = `Đoàn quân: Ngoại lực f = ${formatVietnameseNumber(frequency, 2)} Hz`;
      ctx.font = 'bold 10px "Be Vietnam Pro", sans-serif';
      const textWidth = ctx.measureText(tagText).width;
      const tagBoxW = textWidth + 14;
      const tagBoxH = 18;
      const tagBoxX = platoonMidX - tagBoxW / 2;
      const tagBoxY = platoonMidY - 38;

      ctx.save();
      // Label background box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(tagBoxX, tagBoxY, tagBoxW, tagBoxH, 4);
      ctx.fill();

      // Small pointer triangle pointing down to platoon
      ctx.beginPath();
      ctx.moveTo(platoonMidX - 3.5, tagBoxY + tagBoxH);
      ctx.lineTo(platoonMidX, tagBoxY + tagBoxH + 4);
      ctx.lineTo(platoonMidX + 3.5, tagBoxY + tagBoxH);
      ctx.closePath();
      ctx.fill();

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, platoonMidX, tagBoxY + tagBoxH / 2);
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [frequency, amplitude, isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900/95 p-6 flex flex-col justify-between backdrop-blur-md overflow-hidden'
          : 'relative w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs'
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 border-b text-xs ${
          isFullscreen
            ? 'border-slate-700 bg-slate-800 text-white'
            : 'border-slate-100 bg-slate-50/70 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="font-bold tracking-wide">MÔ PHỎNG DAO ĐỘNG CỦA CẦU THEO TẦN SỐ NGOẠI LỰC</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-xs ${
              isFullscreen
                ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title={isFullscreen ? 'Thu nhỏ (ESC)' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`p-2 flex justify-center items-center ${isFullscreen ? 'flex-1 my-auto' : ''}`}>
        <canvas
          ref={canvasRef}
          width={640}
          height={230}
          className="w-full max-w-full h-auto rounded-lg select-none"
        />
      </div>

      {/* Numerical display footer */}
      <div
        className={`px-3.5 py-2.5 border-t flex flex-wrap items-center justify-between text-xs gap-2 ${
          isFullscreen
            ? 'bg-slate-800 border-slate-700 text-white'
            : 'bg-slate-50/90 border-slate-200/80 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <span>
            Tần số ngoại lực (f):{' '}
            <strong className="text-blue-500 font-bold text-sm">
              {formatVietnameseNumber(frequency, 2)} Hz
            </strong>
          </span>
          <span>
            Biên độ dao động (A):{' '}
            <strong
              className={`font-bold text-sm ${
                amplitude >= 100 ? 'text-red-500' : amplitude >= 50 ? 'text-amber-500' : 'text-blue-500'
              }`}
            >
              {formatVietnameseNumber(amplitude, 2)} cm
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
