export interface DataPoint {
  id: string;
  frequency: number; // in Hz
  amplitude: number; // arbitrary model units
  timestamp: number;
}

export type LearningStage = 1 | 2 | 3;

export interface ExperimentPlanning {
  independentVariable: string;
  controlVariable: string;
  isConfirmed: boolean;
}

export interface ReportAnswers {
  studentName?: string;
  studentClass?: string;
  conclusionAnswer: string; // 'Hoàn toàn chính xác' | 'Chưa chính xác' | ''
  argumentBasis?: string; // Căn cứ lập luận ở Mục V
  solutionAnswer: string; // 'Không đi đều và bắt đầu đi tự do' | 'Đi đều bước nhanh hơn' | ''
  criticalDebate?: string; // Góc phản biện ở Mục VI
  engineeringProposal?: string; // Vận dụng và nghiên cứu tiếp theo ở Mục VII
  reflection: string;
}

export type EvaluationStatus = 'correct' | 'incorrect' | 'unanswered' | 'review_required';

export interface QuestionAssessment {
  id: 'q1' | 'q2' | 'q3';
  questionText: string;
  selectedAnswer: string;
  expectedAnswer: string;
  status: EvaluationStatus;
  feedbackText: string;
  correctAnswerDisplay?: string;
  pdfTag: string;
  pdfCorrection?: string;
}

export interface FullAssessmentReport {
  q1: QuestionAssessment;
  q2: QuestionAssessment;
  q3: QuestionAssessment;
  hypothesisClassification: 'consistent' | 'contradictory' | 'ambiguous';
  hypothesisReasoning: string;
}

export interface ReportPayload {
  createdAt: string;
  projectTitle: string;
  studentName?: string;
  studentClass?: string;
  hypothesis: string;
  independentVariable: string;
  controlVariable: string;
  measurements: DataPoint[];
  conclusionAnswer: string;
  argumentBasis?: string;
  solutionAnswer: string;
  criticalDebate?: string;
  engineeringProposal?: string;
  reflection: string;
  isRemoteSubmitted: boolean;
  assessment?: FullAssessmentReport;
}
