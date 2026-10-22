import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ProgressStepper } from './components/ProgressStepper';
import { Interface1_Problem } from './components/Interface1_Problem';
import { Interface2_Experiment } from './components/Interface2_Experiment';
import { Interface3_Report } from './components/Interface3_Report';
import { SuccessModal } from './components/SuccessModal';
import { DataPoint, ExperimentPlanning, LearningStage, ReportAnswers, ReportPayload } from './types/physics';
import { generateReportPDF } from './utils/pdfGenerator';
import { CANONICAL_TEACHER_INFO, buildAssessmentReport, validateHypothesis } from './utils/physics';

const STORAGE_KEY = 'fpt_physics_lab_oscillation_state_v2';

export default function App() {
  // Navigation View State: 'home' (experiment selection) vs 'experiment' (3-stage workspace)
  const [currentView, setCurrentView] = useState<'home' | 'experiment'>('home');

  // Application State
  const [currentStage, setCurrentStage] = useState<LearningStage>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<LearningStage>(1);

  // Interface 1 State
  const [isMarching, setIsMarching] = useState<boolean>(true);
  const [userHypothesis, setUserHypothesis] = useState<string>('');

  // Interface 2 State
  const [planning, setPlanning] = useState<ExperimentPlanning>({
    independentVariable: '',
    controlVariable: '',
    isConfirmed: false,
  });
  const [frequency, setFrequency] = useState<number>(0.5);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Interface 3 State
  const [answers, setAnswers] = useState<ReportAnswers>({
    studentName: '',
    studentClass: '',
    conclusionAnswer: '',
    solutionAnswer: '',
    reflection: '',
  });

  // Submission & Modal State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isRemoteSubmitted, setIsRemoteSubmitted] = useState<boolean>(false);

  // Restore state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userHypothesis) {
          setUserHypothesis(parsed.userHypothesis);
          // Strict verification: Revalidate stored hypothesis before granting access to stage 2+
          const valResult = validateHypothesis(parsed.userHypothesis);
          if (valResult.isValid) {
            if (parsed.currentStage) setCurrentStage(parsed.currentStage);
            if (parsed.maxUnlockedStage) setMaxUnlockedStage(parsed.maxUnlockedStage);
          } else {
            setCurrentStage(1);
            setMaxUnlockedStage(1);
          }
        }
        if (parsed.planning) setPlanning(parsed.planning);
        if (parsed.frequency !== undefined) setFrequency(parsed.frequency);
        if (parsed.dataPoints) setDataPoints(parsed.dataPoints);
        if (parsed.answers) setAnswers(parsed.answers);
      }
    } catch (e) {
      console.warn('Could not restore saved session state:', e);
    }
  }, []);

  // Persist state changes to LocalStorage
  useEffect(() => {
    try {
      const stateToSave = {
        currentStage,
        maxUnlockedStage,
        userHypothesis,
        planning,
        frequency,
        dataPoints,
        answers,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save session state:', e);
    }
  }, [currentStage, maxUnlockedStage, userHypothesis, planning, frequency, dataPoints, answers]);

  // Handle hypothesis changes with strict revalidation gate
  const handleHypothesisChange = (newHypothesis: string) => {
    setUserHypothesis(newHypothesis);
    // If student edits hypothesis after acceptance, revalidate before keeping next stage unlocked
    const valResult = validateHypothesis(newHypothesis);
    if (!valResult.isValid && maxUnlockedStage > 1) {
      setMaxUnlockedStage(1);
    }
  };

  // Stage transition helpers
  const handleHypothesisSubmit = () => {
    const valResult = validateHypothesis(userHypothesis);
    if (!valResult.isValid) return;
    setMaxUnlockedStage((prev) => (prev < 2 ? 2 : prev));
    setCurrentStage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReport = () => {
    setMaxUnlockedStage((prev) => (prev < 3 ? 3 : prev));
    setCurrentStage(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStage = (stage: LearningStage) => {
    setCurrentStage(stage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    setCurrentStage((prev) => (prev > 1 ? ((prev - 1) as LearningStage) : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update planning variables
  const handleUpdatePlanning = (
    independent: string,
    control: string,
    isConfirmed: boolean
  ) => {
    setPlanning({
      independentVariable: independent,
      controlVariable: control,
      isConfirmed,
    });
  };

  // Add / remove measurement
  const handleAddDataPoint = (point: DataPoint) => {
    setDataPoints((prev) => [...prev, point]);
  };

  const handleRemoveDataPoint = (id: string) => {
    setDataPoints((prev) => prev.filter((p) => p.id !== id));
  };

  // Update answers
  const handleUpdateAnswers = (updated: Partial<ReportAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...updated }));
  };

  // Helper to compile full report payload
  const getReportPayload = (): ReportPayload => {
    const assessment = buildAssessmentReport(answers, userHypothesis);
    return {
      createdAt: new Date().toISOString(),
      projectTitle:
        'Xây dựng website mô phỏng thực tế chương Dao động (Vật lí 11) - THPT FPT Cần Thơ',
      studentName: answers.studentName,
      studentClass: answers.studentClass,
      hypothesis: userHypothesis,
      independentVariable: planning.independentVariable || 'Tần số bước chân f (Hz)',
      controlVariable: planning.controlVariable || 'Khối lượng đoàn quân & Chiều dài nhịp cầu',
      measurements: dataPoints,
      conclusionAnswer: answers.conclusionAnswer,
      argumentBasis: answers.argumentBasis,
      solutionAnswer: answers.solutionAnswer,
      criticalDebate: answers.criticalDebate,
      engineeringProposal: answers.engineeringProposal,
      reflection: answers.reflection,
      isRemoteSubmitted,
      assessment,
    };
  };

  // Submit report & generate PDF
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const reportData = getReportPayload();

    let remoteSuccess = false;

    // Optional Remote submission check
    const reportApiUrl = (import.meta as any).env?.VITE_REPORT_API_URL;
    if (reportApiUrl && reportApiUrl.trim() !== '') {
      try {
        const response = await fetch(reportApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
        if (response.ok) {
          remoteSuccess = true;
        } else {
          console.warn('Remote report API returned status:', response.status);
        }
      } catch (err) {
        console.warn('Could not submit report to remote endpoint:', err);
      }
    }

    setIsRemoteSubmitted(remoteSuccess);

    // Generate real, comprehensive A4 PDF file with automatic download
    const pdfResult = await generateReportPDF(
      'physics-lab-report-sheet',
      reportData,
      `Bao_cao_thi_nghiem_cong_huong_Vat_li_11.pdf`
    );

    setIsSubmitting(false);

    if (pdfResult.success) {
      setShowSuccessModal(true);
    } else {
      setSubmissionError(pdfResult.error || 'Có lỗi khi xuất tệp PDF. Em hãy thử lại nhé.');
    }
  };

  // Reset Lab completely
  const handleResetLab = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentStage(1);
    setMaxUnlockedStage(1);
    setIsMarching(true);
    setUserHypothesis('');
    setPlanning({
      independentVariable: '',
      controlVariable: '',
      isConfirmed: false,
    });
    setFrequency(0.5);
    setDataPoints([]);
    setAnswers({
      studentName: '',
      studentClass: '',
      conclusionAnswer: '',
      argumentBasis: '',
      solutionAnswer: '',
      criticalDebate: '',
      engineeringProposal: '',
      reflection: '',
    });
    setShowSuccessModal(false);
    setIsRemoteSubmitted(false);
    setSubmissionError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'home') {
    return (
      <HomePage
        onSelectExperiment={(experimentId) => {
          if (experimentId === 'resonance') {
            setCurrentView('experiment');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        hasSavedProgress={dataPoints.length > 0 || userHypothesis.trim().length > 0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Compact Header */}
      <Header
        onReset={handleResetLab}
        onBackToHome={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Progress Navigation Stepper */}
      <ProgressStepper
        currentStage={currentStage}
        maxUnlockedStage={maxUnlockedStage}
        onSelectStage={handleSelectStage}
        onGoBack={handleGoBack}
      />

      {/* Main Single-Focused-Screen Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* SCREEN 1: Problem Identification & Hypothesis */}
        {currentStage === 1 && (
          <Interface1_Problem
            isMarching={isMarching}
            onToggleMarching={() => setIsMarching((prev) => !prev)}
            onSetMarching={(val) => setIsMarching(val)}
            userHypothesis={userHypothesis}
            onHypothesisChange={handleHypothesisChange}
            onHypothesisSubmit={handleHypothesisSubmit}
            isUnlocked={true}
          />
        )}

        {/* SCREEN 2: Experimental Planning & Data Collection */}
        {currentStage === 2 && (
          <Interface2_Experiment
            userHypothesis={userHypothesis}
            planning={planning}
            onUpdatePlanning={handleUpdatePlanning}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            dataPoints={dataPoints}
            onAddDataPoint={handleAddDataPoint}
            onRemoveDataPoint={handleRemoveDataPoint}
            onClearDataPoints={() => setDataPoints([])}
            onOpenReport={handleOpenReport}
          />
        )}

        {/* SCREEN 3: Data Analysis, Assessment & Reporting */}
        {currentStage === 3 && (
          <Interface3_Report
            userHypothesis={userHypothesis}
            independentVariable={planning.independentVariable}
            controlVariable={planning.controlVariable}
            dataPoints={dataPoints}
            answers={answers}
            onUpdateAnswers={handleUpdateAnswers}
            onSubmitReport={handleSubmitReport}
            isSubmitting={isSubmitting}
            submissionError={submissionError}
            onGoBackToExperiment={() => handleSelectStage(2)}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p>THPT FPT Cần Thơ — Dự án Nghiên cứu Khoa học - Kĩ thuật</p>
        </div>
      </footer>

      {/* Completion & Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        isRemoteSubmitted={isRemoteSubmitted}
        onDownloadAgain={() =>
          generateReportPDF(
            'physics-lab-report-sheet',
            getReportPayload(),
            'Bao_cao_thi_nghiem_cong_huong_Vat_li_11.pdf'
          )
        }
        onResetLab={handleResetLab}
      />
    </div>
  );
}
