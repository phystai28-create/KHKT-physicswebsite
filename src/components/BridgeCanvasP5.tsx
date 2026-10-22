import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { Maximize2, Minimize2, Footprints, ShieldAlert, ShieldCheck } from 'lucide-react';

interface BridgeCanvasP5Props {
  isMarching: boolean;
  onToggleMarching?: () => void;
  onSetMarching?: (marching: boolean) => void;
}

export const BridgeCanvasP5: React.FC<BridgeCanvasP5Props> = ({
  isMarching,
  onToggleMarching,
  onSetMarching,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stateRef = useRef({
    isMarching,
    currentAmplitude: isMarching ? 24 : 4,
    targetAmplitude: isMarching ? 25 : 4,
    warningLevel: isMarching ? 0.9 : 0.05,
    deckBaselineYRatio: 0.48, // Raised bridge deck (approx 48% of height)
    waterLevelYRatio: 0.76, // Water level safely below deck (clearance > 85px)
  });

  // Sync stateRef with props
  useEffect(() => {
    stateRef.current.isMarching = isMarching;
    if (isMarching) {
      stateRef.current.targetAmplitude = 25;
    } else {
      stateRef.current.targetAmplitude = 4;
    }
  }, [isMarching]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      if (wrapperRef.current?.requestFullscreen) {
        try {
          await wrapperRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch {
          // Fallback to overlay mode if browser/iframe blocks requestFullscreen
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

  // Sync with document fullscreenchange & escape key
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

  // Handle resize when fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (p5InstanceRef.current && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = isFullscreen
          ? Math.max(480, window.innerHeight - 130)
          : Math.min(380, Math.max(300, Math.floor(w * 0.45)));
        p5InstanceRef.current.resizeCanvas(w, h);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    if (!containerRef.current) return;

    interface Soldier {
      x: number;
      speed: number;
      phaseOffset: number;
      strideRate: number;
      uniformHue: number;
    }

    const sketch = (p: p5) => {
      let width = 760;
      let height = 340;
      let time = 0;
      let soldiers: Soldier[] = [];

      const initSoldiers = () => {
        soldiers = [];
        const count = 10;
        const spacing = 38;
        const startX = width * 0.22;
        // Diverse stride rates and phases so that in free mode, every person steps to their own rhythm
        const freeRates = [1.8, 3.5, 2.2, 3.9, 2.0, 3.6, 2.6, 1.9, 3.8, 2.3];
        const freePhases = [0.0, 2.4, 4.8, 1.2, 5.5, 3.1, 0.7, 4.3, 2.8, 1.6];
        for (let i = 0; i < count; i++) {
          soldiers.push({
            x: startX + i * spacing,
            speed: 0.85,
            phaseOffset: freePhases[i % freePhases.length],
            strideRate: freeRates[i % freeRates.length],
            uniformHue: i % 2 === 0 ? 0 : 1,
          });
        }
      };

      p.setup = () => {
        width = containerRef.current?.clientWidth || 760;
        height = isFullscreen
          ? Math.max(480, window.innerHeight - 130)
          : Math.min(380, Math.max(300, Math.floor(width * 0.45)));
        const canvas = p.createCanvas(width, height);
        canvas.parent(containerRef.current!);
        initSoldiers();
      };

      p.windowResized = () => {
        if (!containerRef.current) return;
        width = containerRef.current.clientWidth;
        height = isFullscreen
          ? Math.max(480, window.innerHeight - 130)
          : Math.min(380, Math.max(300, Math.floor(width * 0.45)));
        p.resizeCanvas(width, height);
      };

      p.draw = () => {
        time += 0.045;
        const state = stateRef.current;

        // Smoothly interpolate amplitude towards target
        const lerpSpeed = state.isMarching ? 0.018 : 0.04;
        state.currentAmplitude = p.lerp(state.currentAmplitude, state.targetAmplitude, lerpSpeed);

        // Warning level based on amplitude
        const targetWarning = p.constrain(p.map(state.currentAmplitude, 6, 24, 0, 1), 0, 1);
        state.warningLevel = p.lerp(state.warningLevel, targetWarning, 0.035);

        // Background: clean scientific lab environment with subtle sky gradient
        p.background(248, 250, 252);

        // Soft engineering grid
        p.stroke(226, 232, 240, 130);
        p.strokeWeight(1);
        const gridSize = 28;
        for (let x = 0; x < width; x += gridSize) {
          p.line(x, 0, x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
          p.line(0, y, width, y);
        }

        // Bridge Geometric Calculations - MATCHING MODULE 2 (KHU VỰC 2)
        // RAISED BRIDGE DECK: Deck baseline is at ~48% height
        const baselineY = height * 0.48;
        const tower1X = width * 0.16;
        const tower2X = width * 0.84;
        const towerTopY = height * 0.10; // Elegant taller suspension towers
        const towerHeight = baselineY - towerTopY;

        // River surface safely elevated below the bridge
        const waterLevelY = height * 0.76;
        const deckSpanStart = width * 0.05;
        const deckSpanEnd = width * 0.95;
        const deckSpan = deckSpanEnd - deckSpanStart;

        // Draw River Water with gentle realistic waves & depth
        p.noStroke();
        // Upper water layer
        p.fill(224, 242, 254, 180); // sky-100
        p.rect(0, waterLevelY, width, height - waterLevelY);

        // Deeper water layer
        p.fill(186, 230, 253, 140); // sky-200
        p.rect(0, waterLevelY + 16, width, height - (waterLevelY + 16));

        // River surface wave lines
        p.stroke(56, 189, 248, 180);
        p.strokeWeight(1.5);
        p.noFill();
        p.beginShape();
        for (let x = 0; x <= width; x += 16) {
          const waveY = waterLevelY + Math.sin(x * 0.025 + time * 1.2) * 3;
          p.vertex(x, waveY);
        }
        p.endShape();

        p.stroke(14, 165, 233, 120);
        p.strokeWeight(1.2);
        p.beginShape();
        for (let x = 0; x <= width; x += 20) {
          const waveY = waterLevelY + 8 + Math.sin(x * 0.035 - time * 0.9) * 2.5;
          p.vertex(x, waveY);
        }
        p.endShape();

        // Left and Right Shoreline Abutments (Mố cầu bờ sông)
        p.fill(203, 213, 225); // slate-300
        p.stroke(100, 116, 139);
        p.strokeWeight(1.5);
        // Left abutment
        p.quad(
          0, baselineY - 4,
          deckSpanStart + 10, baselineY - 4,
          deckSpanStart + 2, height,
          0, height
        );
        // Right abutment
        p.quad(
          deckSpanEnd - 10, baselineY - 4,
          width, baselineY - 4,
          width, height,
          deckSpanEnd - 2, height
        );

        // Concrete Tower Foundations / Piers (Trụ tháp bê tông)
        p.fill(148, 163, 184); // slate-400
        p.stroke(71, 85, 105);
        p.strokeWeight(1.5);
        const pierWidth = 24;
        // Left tower pier
        p.rect(tower1X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6), 3);
        // Right tower pier
        p.rect(tower2X - pierWidth / 2, baselineY + 6, pierWidth, waterLevelY + 18 - (baselineY + 6), 3);

        // Tower Steel Trusses (Tháp thép chịu lực)
        p.stroke(51, 65, 85); // slate-700
        p.strokeWeight(2.5);
        p.fill(203, 213, 225); // slate-300

        // Left Tower
        p.rect(tower1X - 8, towerTopY, 16, towerHeight + 12, 2);
        // Tower cross-bracing (giằng tháp)
        p.stroke(100, 116, 139);
        p.strokeWeight(1.2);
        const braceSegments = 4;
        for (let b = 0; b < braceSegments; b++) {
          const y1 = towerTopY + (b / braceSegments) * (towerHeight + 10);
          const y2 = towerTopY + ((b + 1) / braceSegments) * (towerHeight + 10);
          p.line(tower1X - 8, y1, tower1X + 8, y2);
          p.line(tower1X + 8, y1, tower1X - 8, y2);
        }

        // Right Tower
        p.stroke(51, 65, 85);
        p.strokeWeight(2.5);
        p.rect(tower2X - 8, towerTopY, 16, towerHeight + 12, 2);
        p.stroke(100, 116, 139);
        p.strokeWeight(1.2);
        for (let b = 0; b < braceSegments; b++) {
          const y1 = towerTopY + (b / braceSegments) * (towerHeight + 10);
          const y2 = towerTopY + ((b + 1) / braceSegments) * (towerHeight + 10);
          p.line(tower2X - 8, y1, tower2X + 8, y2);
          p.line(tower2X + 8, y1, tower2X - 8, y2);
        }

        // Tower Saddles at top
        p.fill(30, 41, 59);
        p.noStroke();
        p.circle(tower1X, towerTopY, 10);
        p.circle(tower2X, towerTopY, 10);

        // Main Suspension Cable Geometry
        p.noFill();
        p.stroke(51, 65, 85);
        p.strokeWeight(3.5);
        // Left shore backstay
        p.line(deckSpanStart - 8, baselineY + 8, tower1X, towerTopY);
        // Right shore backstay
        p.line(deckSpanEnd + 8, baselineY + 8, tower2X, towerTopY);

        // Maximum static sag of suspension cable
        const minSagClearance = Math.max(34, height * 0.10);
        const maxSag = Math.max(20, baselineY - towerTopY - minSagClearance);

        // Dynamic oscillation wave factor
        const oscFrequency = 3.6; // Matches 2.0 Hz resonance feeling
        const oscWave = Math.sin(time * oscFrequency);

        // Dynamic cable Y function matching Module 2 (dây cáp chính uốn lượn đồng bộ)
        const getDynamicCableY = (x: number): number => {
          if (x >= tower1X && x <= tower2X) {
            const normTower = (x - tower1X) / (tower2X - tower1X);
            const staticSag = 4 * normTower * (1 - normTower) * maxSag;
            const cableEnvelope = Math.sin(normTower * Math.PI);
            const cableDy = state.currentAmplitude * cableEnvelope * oscWave * 0.75;
            return towerTopY + staticSag + cableDy;
          } else if (x < tower1X) {
            const normBack = (x - (deckSpanStart - 8)) / (tower1X - (deckSpanStart - 8));
            return (baselineY + 8) + normBack * (towerTopY - (baselineY + 8));
          } else {
            const normBack = (x - tower2X) / ((deckSpanEnd + 8) - tower2X);
            return towerTopY + normBack * ((baselineY + 8) - towerTopY);
          }
        };

        // Center parabolic main cable with dynamic wave oscillation
        p.beginShape();
        for (let x = tower1X; x <= tower2X; x += 4) {
          p.vertex(x, getDynamicCableY(x));
        }
        p.endShape();

        // Inner metallic highlight on dynamic main cable
        p.stroke(148, 163, 184);
        p.strokeWeight(1.2);
        p.beginShape();
        for (let x = tower1X; x <= tower2X; x += 8) {
          p.vertex(x, getDynamicCableY(x) - 0.5);
        }
        p.endShape();

        // Calculate Bridge Deck Oscillation Points - SMOOTH STANDING WAVE MATCHING MODULE 2
        const numSegments = 80;
        const deckPoints: { x: number; y: number }[] = [];
        for (let i = 0; i <= numSegments; i++) {
          const x = deckSpanStart + (i / numSegments) * deckSpan;
          const normX = (x - deckSpanStart) / deckSpan;
          // Clean sinusoidal standing wave without artificial crushing
          const envelope = Math.sin(normX * Math.PI);
          const dy = state.currentAmplitude * envelope * oscWave;
          const deckY = baselineY + dy;
          deckPoints.push({ x, y: deckY });
        }

        // VERTICAL SUSPENSION CABLES (Dây cáp giằng / dây treo thẳng đứng)
        const hangerSpacing = 18;
        for (let x = tower1X + 16; x < tower2X; x += hangerSpacing) {
          const cableY = getDynamicCableY(x);
          const normDeck = (x - deckSpanStart) / deckSpan;
          const dy = state.currentAmplitude * Math.sin(normDeck * Math.PI) * oscWave;
          const deckY = baselineY + dy;

          // Top clamp collar on main cable
          p.noStroke();
          p.fill(51, 65, 85);
          p.circle(x, cableY, 4.5);

          // Vertical steel wire (dây cáp giằng thẳng đứng)
          p.stroke(100, 116, 139, 230);
          p.strokeWeight(1.4);
          p.line(x, cableY, x, deckY);

          // Bottom clamp pin on bridge deck beam
          p.noStroke();
          p.fill(194, 65, 12);
          p.circle(x, deckY, 3.5);
        }

        // Bridge Deck Color & Warning Stress Interpolation
        // Safe: Deep Indigo/Navy (30, 58, 138), Alert: Crimson (220, 38, 38)
        const deckR = p.lerp(30, 220, state.warningLevel);
        const deckG = p.lerp(58, 38, state.warningLevel);
        const deckB = p.lerp(138, 38, state.warningLevel);

        // Draw Deck Lower Truss (Giàn không gian dưới mặt cầu)
        p.stroke(deckR, deckG, deckB, 160);
        p.strokeWeight(1.3);
        const trussDepth = 10;
        for (let i = 0; i < deckPoints.length - 2; i += 2) {
          const p1 = deckPoints[i];
          const p2 = deckPoints[i + 2];
          p.line(p1.x, p1.y, p2.x, p2.y + trussDepth);
          p.line(p1.x, p1.y + trussDepth, p2.x, p2.y);
          p.line(p1.x, p1.y + trussDepth, p2.x, p2.y + trussDepth);
        }

        // Base structural deck beam
        p.stroke(51, 65, 85);
        p.strokeWeight(6);
        p.noFill();
        p.beginShape();
        for (const pt of deckPoints) {
          p.vertex(pt.x, pt.y + 2);
        }
        p.endShape();

        // Vibrant orange deck roadway matching Module 2
        p.stroke(234, 88, 12);
        p.strokeWeight(4.5);
        p.beginShape();
        for (const pt of deckPoints) {
          p.vertex(pt.x, pt.y);
        }
        p.endShape();

        // Deck roadway dashed center line
        p.stroke(255, 255, 255, 180);
        p.strokeWeight(1.2);
        p.beginShape();
        for (const pt of deckPoints) {
          p.vertex(pt.x, pt.y);
        }
        p.endShape();

        // -------------------------------------------------------------
        // SOLDIERS MARCHING ANIMATION: HIGHLY CONTRASTED & DISTINCT MODES
        // -------------------------------------------------------------
        const marchCadence = time * 3.8; // Uniform synchronized cadence
        const isImpactMoment = Math.sin(marchCadence) < -0.7; // Simultaneous stomp down

        for (let idx = 0; idx < soldiers.length; idx++) {
          const s = soldiers[idx];

          // Move soldier from left to right across bridge
          s.x += s.speed;
          if (s.x > deckSpanEnd - 16) {
            s.x = deckSpanStart + 16;
          }

          // Exact Deck Y at soldier's current position on the orange deck
          const normDeck = (s.x - deckSpanStart) / deckSpan;
          const envelope = Math.sin(Math.max(0, Math.min(1, normDeck)) * Math.PI);
          const currentDeckY = baselineY + state.currentAmplitude * envelope * oscWave;

          let leftLegSwing = 0;
          let rightLegSwing = 0;
          let leftKneeLift = 0;
          let rightKneeLift = 0;
          let stepLift = 0;
          let armSwing = 0;
          let isFootDown = false;

          if (state.isMarching) {
            // ==========================================
            // MODE 1: SYNCHRONIZED MARCHING (ĐI ĐỀU BƯỚC)
            // ==========================================
            // Every single soldier steps with the EXACT SAME CADENCE AND PHASE!
            // Cùng nhịp bước - đồng bộ hoàn toàn
            leftLegSwing = Math.sin(marchCadence) * 8.5;
            rightLegSwing = -Math.sin(marchCadence) * 8.5;
            leftKneeLift = Math.max(0, Math.sin(marchCadence)) * 4.5;
            rightKneeLift = Math.max(0, -Math.sin(marchCadence)) * 4.5;
            stepLift = Math.abs(Math.sin(marchCadence)) * 4.5;
            armSwing = Math.sin(marchCadence) * 6.5;
            isFootDown = isImpactMoment;
          } else {
            // ==========================================
            // MODE 2: FREE WALKING (ĐI TỰ DO)
            // ==========================================
            // EACH PERSON HAS THEIR OWN INDEPENDENT CADENCE & PHASE!
            // Mỗi người trong đoàn quân bước 1 nhịp hoàn toàn khác nhau
            const freeCadence = time * s.strideRate + s.phaseOffset;
            leftLegSwing = Math.sin(freeCadence) * 6.5;
            rightLegSwing = -Math.sin(freeCadence) * 6.5;
            leftKneeLift = Math.max(0, Math.sin(freeCadence)) * 3.0;
            rightKneeLift = Math.max(0, -Math.sin(freeCadence)) * 3.0;
            stepLift = Math.abs(Math.sin(freeCadence)) * 2.5;
            armSwing = Math.sin(freeCadence) * 4.5;
            isFootDown = Math.sin(freeCadence) < -0.8;
          }

          const soldierY = currentDeckY - 17 - stepLift;

          p.push();
          p.translate(s.x, soldierY);

          // Head & Beret
          p.noStroke();
          if (state.isMarching) {
            // Uniform military red beret
            p.fill(220, 38, 38);
            p.circle(0, -12, 9.5);
            p.fill(30, 41, 59);
            p.rect(-5, -15, 10, 3.5, 1);
          } else {
            // Varied casual caps (blue/emerald)
            p.fill(s.uniformHue === 0 ? [37, 99, 235] : [16, 185, 129]);
            p.circle(0, -11.5, 9);
            p.fill(51, 65, 85);
            p.rect(-4.5, -14, 9, 3, 1);
          }

          // Torso / Body
          p.stroke(30, 41, 59);
          p.strokeWeight(3.5);
          p.line(0, -7, 0, 6);

          // Field backpack
          p.noStroke();
          p.fill(71, 85, 105);
          p.rect(-6, -6, 5, 8, 1);

          // Arms swinging
          p.stroke(state.isMarching ? [220, 38, 38] : [51, 65, 85]);
          p.strokeWeight(2.2);
          p.line(0, -4, armSwing * 0.8, 3);
          p.line(0, -4, -armSwing * 0.8, 3);

          // LEGS WITH VISIBLE KNEES AND BOOTS
          // Left Leg: Hip (-2, 6) -> Knee -> Foot with boot
          p.stroke(30, 41, 59);
          p.strokeWeight(2.4);
          const leftKneeX = -2 + leftLegSwing * 0.6;
          const leftKneeY = 13 - leftKneeLift;
          const leftFootX = -2 + leftLegSwing;
          const leftFootY = 20;
          p.line(-2, 6, leftKneeX, leftKneeY);
          p.line(leftKneeX, leftKneeY, leftFootX, leftFootY);
          p.strokeWeight(3);
          p.line(leftFootX, leftFootY, leftFootX + 3.5, leftFootY);

          // Right Leg: Hip (2, 6) -> Knee -> Foot with boot
          p.stroke(51, 65, 85);
          p.strokeWeight(2.4);
          const rightKneeX = 2 + rightLegSwing * 0.6;
          const rightKneeY = 13 - rightKneeLift;
          const rightFootX = 2 + rightLegSwing;
          const rightFootY = 20;
          p.line(2, 6, rightKneeX, rightKneeY);
          p.line(rightKneeX, rightKneeY, rightFootX, rightFootY);
          p.strokeWeight(3);
          p.line(rightFootX, rightFootY, rightFootX + 3.5, rightFootY);

          // Downward Force Impulses & Shockwaves
          if (state.isMarching && isFootDown) {
            // Synchronized red downward impact vector from foot into deck
            p.stroke(239, 68, 68, 230);
            p.strokeWeight(2.2);
            p.line(0, 20, 0, 30);
            p.line(0, 30, -3.5, 26);
            p.line(0, 30, 3.5, 26);

            // Expanding shock ripple on deck surface
            p.noFill();
            p.stroke(239, 68, 68, 180);
            p.strokeWeight(1.5);
            p.ellipse(0, 21 + stepLift, 16, 5);
          } else if (!state.isMarching && isFootDown) {
            // Subtle, independent footprint (no collective shock)
            p.noStroke();
            p.fill(148, 163, 184, 120);
            p.ellipse(0, 20 + stepLift, 6, 2.5);
          }

          p.pop();
        }

        // -------------------------------------------------------------
        // AMPLITUDE METER ON RIGHT
        // -------------------------------------------------------------
        const meterX = width - 46;
        const meterY = 46;
        const meterH = Math.min(100, height * 0.32);

        // Card container
        p.fill(255, 255, 255, 225);
        p.stroke(203, 213, 225);
        p.strokeWeight(1);
        p.rect(meterX - 24, meterY - 18, 52, meterH + 42, 8);

        // Header
        p.noStroke();
        p.fill(71, 85, 105);
        p.textSize(9);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('BIÊN ĐỘ', meterX + 2, meterY - 8);

        // Background track
        p.fill(241, 245, 249);
        p.stroke(203, 213, 225);
        p.strokeWeight(1);
        p.rect(meterX - 7, meterY + 6, 18, meterH, 4);

        // Filled level
        const fillH = p.map(state.currentAmplitude, 4, 25, 4, meterH);
        p.noStroke();
        p.fill(deckR, deckG, deckB);
        p.rect(meterX - 6, meterY + 6 + meterH - fillH, 16, fillH, 3);

        // Danger threshold line
        p.stroke(239, 68, 68);
        p.strokeWeight(1.2);
        p.line(meterX - 10, meterY + 6 + meterH * 0.3, meterX + 14, meterY + 6 + meterH * 0.3);

        // Numerical readout scaled to mm matching physical model
        const displayValue = Math.round(p.map(state.currentAmplitude, 4, 25, 12, 108));
        p.noStroke();
        p.fill(deckR, deckG, deckB);
        p.textSize(10);
        p.textStyle(p.BOLD);
        p.text(`${displayValue}`, meterX + 2, meterY + meterH + 16);
      };
    };

    const p5Instance = new p5(sketch);
    p5InstanceRef.current = p5Instance;

    return () => {
      p5Instance.remove();
      p5InstanceRef.current = null;
    };
  }, [isFullscreen]);

  return (
    <div
      ref={wrapperRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900/95 p-4 sm:p-6 flex flex-col justify-between backdrop-blur-md overflow-hidden'
          : 'relative w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs'
      }`}
    >
      {/* Fullscreen Header Bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                MÔ PHỎNG HIỆN TƯỢNG CỘNG HƯỞNG CẦU TREO
              </h2>
              <p className="text-xs text-slate-300">
                Chế độ quan sát toàn màn hình — Khảo sát đáp ứng kết cấu dưới ngoại lực tuần hoàn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Mode Toggle in Fullscreen */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => (onSetMarching ? onSetMarching(true) : (!isMarching && onToggleMarching?.()))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  isMarching
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Đi đều bước</span>
              </button>
              <button
                type="button"
                onClick={() => (onSetMarching ? onSetMarching(false) : (isMarching && onToggleMarching?.()))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  !isMarching
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đi tự do</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-medium cursor-pointer transition-colors"
              title="Thoát toàn màn hình (ESC)"
            >
              <Minimize2 className="w-4 h-4 text-slate-300" />
              <span>Thu nhỏ (ESC)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center items-center select-none ${
          isFullscreen ? 'flex-1 my-auto' : ''
        }`}
        style={{ minHeight: isFullscreen ? '440px' : '300px' }}
      />

      {/* Fullscreen Trigger Button (Visible in Normal Mode) */}
      {!isFullscreen && (
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
          title="Mở toàn màn hình để quan sát chi tiết"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Toàn màn hình</span>
        </button>
      )}

      {/* Dynamic Status / Warning Overlay Badge */}
      <div className={`absolute top-3 left-3 flex items-center space-x-2 z-10`}>
        {isMarching ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-50/95 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-xs border border-red-200 backdrop-blur-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span>CẢNH BÁO: ĐIỀU KIỆN CỘNG HƯỞNG — BIÊN ĐỘ TĂNG ĐỘT BIẾN</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50/95 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs border border-emerald-200 backdrop-blur-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>AN TOÀN: BƯỚC TỰ DO TRIỆT TIÊU NGOẠI LỰC — DAO ĐỘNG GIẢM DẦN</span>
          </div>
        )}
      </div>

      {/* Educational Note Footer */}
      <div
        className={`select-none text-[11px] ${
          isFullscreen
            ? 'pt-2 border-t border-slate-800 text-slate-400 flex justify-between items-center'
            : 'absolute bottom-2 left-3 text-slate-400'
        }`}
      >
        <span>
          Mô hình trực quan
        </span>
        {isFullscreen && (
          <span className="text-slate-400">
            Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-[10px]">ESC</kbd> để thoát
          </span>
        )}
      </div>
    </div>
  );
};
