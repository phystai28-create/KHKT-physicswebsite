import React from 'react';
import { Check, Lock, ChevronLeft } from 'lucide-react';
import { LearningStage } from '../types/physics';

interface ProgressStepperProps {
  currentStage: LearningStage;
  maxUnlockedStage: LearningStage;
  onSelectStage: (stage: LearningStage) => void;
  onGoBack?: () => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStage,
  maxUnlockedStage,
  onSelectStage,
  onGoBack,
}) => {
  const steps = [
    { id: 1 as LearningStage, number: '01', title: 'Đặt vấn đề' },
    { id: 2 as LearningStage, number: '02', title: 'Thực nghiệm' },
    { id: 3 as LearningStage, number: '03', title: 'Báo cáo' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Back button if not at stage 1 */}
          <div className="w-24">
            {currentStage > 1 && onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          {/* Stepper items */}
          <div className="flex items-center gap-2 sm:gap-4">
            {steps.map((step, idx) => {
              const isCompleted = step.id < currentStage;
              const isCurrent = step.id === currentStage;
              const isUnlocked = step.id <= maxUnlockedStage;

              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => isUnlocked && onSelectStage(step.id)}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-2 py-1 px-2.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : isCompleted
                        ? 'text-slate-700 hover:text-slate-900 cursor-pointer'
                        : isUnlocked
                        ? 'text-slate-600 hover:text-slate-900 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-bold'
                          : isCompleted
                          ? 'bg-emerald-600 text-white font-bold'
                          : isUnlocked
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : !isUnlocked ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : (
                        step.id
                      )}
                    </span>
                    <span>{step.number} {step.title}</span>
                  </button>

                  {idx < steps.length - 1 && (
                    <span className="text-slate-300 text-xs select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Balance spacer */}
          <div className="w-24 text-right">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Bước {currentStage}/3
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};
