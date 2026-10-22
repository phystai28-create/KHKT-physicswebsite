import {
  QuestionAssessment,
  FullAssessmentReport,
  ReportAnswers,
} from '../types/physics';

export const NATURAL_FREQUENCY = 2.0; // f0 = 2.0 Hz

/** Canonical supervising teacher metadata */
export const CANONICAL_TEACHER_INFO = '';
export const TEACHER_TITLE = '';
export const SCHOOL_NAME = 'THPT FPT Cần Thơ';

export const MIN_MATCHED_KEYWORDS = 2;
export const MIN_HYPOTHESIS_LENGTH = 15;

/** Exact required suggested keyword list */
export const HYPOTHESIS_KEYWORDS = [
  'nhịp',
  'đều',
  'bước chân',
  'tần số',
  'biên độ',
  'rung lắc',
  'cộng hưởng',
] as const;

export interface HypothesisValidationResult {
  isValid: boolean;
  length: number;
  minLength: number;
  isLengthValid: boolean;
  matchedKeywords: string[];
  matchedCount: number;
  minKeywords: number;
  isKeywordsValid: boolean;
  message: string;
  secondaryHint?: string;
}

/**
 * Pedagogical physics model for bridge resonance response (Lorentzian distribution):
 * A = 100 / (1 + 4 * (f - 2.0)^2)
 * Smooth bell shape with precision to the hundredths place (hàng phần trăm)
 */
export function calculateAmplitude(f: number): number {
  const amplitude = 100 / (1 + 4 * Math.pow(f - NATURAL_FREQUENCY, 2));
  return parseFloat(amplitude.toFixed(2));
}

/**
 * Format a number to Vietnamese localized decimal string (using comma)
 * Preserves precision to hundredths (hàng phần trăm) by default
 */
export function formatVietnameseNumber(val: number, decimals: number = 2): string {
  if (typeof val !== 'number' || isNaN(val)) return '0';
  return val.toFixed(decimals).replace('.', ',');
}

export function formatFrequency(f: number): string {
  return `${formatVietnameseNumber(f, 2)} Hz`;
}

export function formatAmplitude(a: number): string {
  return formatVietnameseNumber(a, 1);
}

/**
 * Removes Vietnamese diacritics for flexible fuzzy keyword matching
 */
export function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/**
 * Checks whether a specific keyword or phrase exists in the given text with word boundary awareness.
 */
function checkKeywordMatch(rawText: string, normText: string, keyword: string): boolean {
  const normKw = normalizeVietnamese(keyword);
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match phrase with flexible whitespace between words
  const kwPhraseAccented = keyword.split(/\s+/).map(escapeRegex).join('\\s+');
  const kwPhraseNorm = normKw.split(/\s+/).map(escapeRegex).join('\\s+');

  // Word boundary regex that accounts for Unicode letters (\p{L} and \p{N})
  const reAccented = new RegExp(`(^|[^\\p{L}\\p{N}])${kwPhraseAccented}([^\\p{L}\\p{N}]|$)`, 'iu');
  const reNorm = new RegExp(`(^|[^\\p{L}\\p{N}])${kwPhraseNorm}([^\\p{L}\\p{N}]|$)`, 'iu');

  return reAccented.test(rawText) || reNorm.test(normText);
}

/**
 * Strict validation for the student's initial hypothesis in Screen 1.
 * Must have:
 * 1. At least 15 characters after trimming.
 * 2. At least MIN_MATCHED_KEYWORDS (default 2) distinct keywords from HYPOTHESIS_KEYWORDS.
 */
export function validateHypothesis(text: string): HypothesisValidationResult {
  const trimmed = text.trim();
  const length = trimmed.length;
  const isLengthValid = length >= MIN_HYPOTHESIS_LENGTH;

  const normText = normalizeVietnamese(trimmed);

  // Find distinct matching keywords from the 7 required keywords
  const matchedKeywords: string[] = [];
  for (const kw of HYPOTHESIS_KEYWORDS) {
    if (checkKeywordMatch(trimmed, normText, kw)) {
      matchedKeywords.push(kw);
    }
  }

  const matchedCount = matchedKeywords.length;
  const isKeywordsValid = matchedCount >= MIN_MATCHED_KEYWORDS;
  const isValid = isLengthValid && isKeywordsValid;

  let message = '';
  let secondaryHint = '';

  if (!isValid) {
    message = 'Không hợp lệ. Hãy cố gắng suy nghĩ và liên hệ với các từ khóa gợi mở.';
    if (!isLengthValid && !isKeywordsValid) {
      secondaryHint = `Giả thuyết cần có ít nhất ${MIN_HYPOTHESIS_LENGTH} ký tự và sử dụng ít nhất ${MIN_MATCHED_KEYWORDS} từ khóa gợi mở khác nhau.`;
    } else if (!isLengthValid) {
      secondaryHint = `Giả thuyết cần có ít nhất ${MIN_HYPOTHESIS_LENGTH} ký tự (hiện có ${length} ký tự).`;
    } else {
      secondaryHint = `Cần sử dụng ít nhất ${MIN_MATCHED_KEYWORDS} từ khóa gợi mở khác nhau (hiện có ${matchedCount} từ khóa).`;
    }
  }

  return {
    isValid,
    length,
    minLength: MIN_HYPOTHESIS_LENGTH,
    isLengthValid,
    matchedKeywords,
    matchedCount,
    minKeywords: MIN_MATCHED_KEYWORDS,
    isKeywordsValid,
    message,
    secondaryHint,
  };
}

/**
 * Evaluates whether the student's initial hypothesis is scientifically consistent,
 * contradictory, or ambiguous relative to the observed resonance phenomenon:
 * "When external driving frequency approaches natural frequency (f = 2.0 Hz), amplitude is maximized."
 */
export function evaluateHypothesisConsistency(hypothesis: string): {
  classification: 'consistent' | 'contradictory' | 'ambiguous';
  expectedConclusion: 'Hoàn toàn chính xác' | 'Chưa chính xác' | 'review_required';
  reason: string;
} {
  const trimmed = hypothesis.trim();
  if (!trimmed) {
    return {
      classification: 'ambiguous',
      expectedConclusion: 'review_required',
      reason: 'Chưa có nội dung giả thuyết ban đầu để đối chiếu.',
    };
  }

  const norm = normalizeVietnamese(trimmed);

  // 1. Check for contradictory cues (claims amplitude is smallest at resonance/2Hz or sync marching reduces shaking)
  const contradictionPatterns = [
    /(nho nhat|it nhat|cuc tieu|it rung|khong rung|dung yen|khong dao dong|giam manh|giam xuong 0|an toan nhat).*(trung|bang|2(\.0)?\s*hz|tan so rieng|cong huong)/,
    /(trung|bang|2(\.0)?\s*hz|tan so rieng|cong huong).*(nho nhat|it nhat|cuc tieu|it rung|khong rung|dung yen|khong dao dong|giam manh|giam xuong 0|an toan)/,
    /di deu.*(it rung|an toan|khong rung|giam bien do|it lac)/,
    /di tu do.*(rung manh|cong huong|nguy hiem|tang bien do|bien do lon)/,
  ];

  const isContradictory = contradictionPatterns.some((pattern) => pattern.test(norm));
  if (isContradictory) {
    return {
      classification: 'contradictory',
      expectedConclusion: 'Chưa chính xác',
      reason:
        'Giả thuyết ban đầu dự đoán sai lệch so với hiện tượng (dự đoán biên độ dao động giảm hoặc an toàn khi tần số trùng nhau). Do đó đối chiếu với thực nghiệm, kết luận phù hợp là "Chưa chính xác".',
    };
  }

  // 2. Check for consistent cues (student correctly predicted that marching in sync, matching frequencies, or resonance causes violent vibration, large amplitude, or danger/collapse)
  const vibrationTerms = [
    'rung manh',
    'rung du doi',
    'rung du',
    'rung lac',
    'lac manh',
    'dao dong manh',
    'bien do lon',
    'bien do cuc dai',
    'bien do tang',
    'bien do tang vot',
    'tang manh',
    'cuc dai',
    'lon nhat',
    'manh nhat',
    'cong huong',
    'sap cau',
    'dut day',
    'gay cau',
    'nguy hiem',
    'vo cau',
    'uon vong',
  ];

  const matchingTerms = [
    'trung',
    'bang',
    'tien gan',
    '2hz',
    '2 hz',
    '2,0',
    'tan so rieng',
    'f0',
    'di deu',
    'dong bo',
    'cung nhip',
    'cung buoc',
    'nhip buoc',
    'tuan hoan',
    'tan so buoc',
  ];

  const hasVibrationImpact = vibrationTerms.some((t) => norm.includes(t));
  const hasMatchingCondition = matchingTerms.some((t) => norm.includes(t));

  if (hasVibrationImpact && hasMatchingCondition) {
    return {
      classification: 'consistent',
      expectedConclusion: 'Hoàn toàn chính xác',
      reason:
        'Giả thuyết ban đầu dự đoán đúng mối liên hệ giữa nhịp bước chân đồng bộ/tần số ngoại lực và sự gia tăng mạnh của biên độ dao động do cộng hưởng.',
    };
  }

  // Explicit mention of resonance
  if (norm.includes('cong huong')) {
    return {
      classification: 'consistent',
      expectedConclusion: 'Hoàn toàn chính xác',
      reason:
        'Giả thuyết ban đầu nhận định chính xác sự xuất hiện của hiện tượng cộng hưởng cơ học.',
    };
  }

  // 3. Ambiguous statement requiring teacher review
  return {
    classification: 'ambiguous',
    expectedConclusion: 'review_required',
    reason:
      'Giả thuyết ban đầu chưa thể hiện rõ dự đoán về mối liên hệ giữa tần số và biên độ dao động, cần giáo viên trực tiếp thẩm định.',
  };
}

/**
 * Question 1 Assessment
 * Evaluates the student's conclusion regarding their original hypothesis.
 */
export function evaluateQuestion1(
  selectedAnswer: string,
  userHypothesis: string
): QuestionAssessment {
  const qText =
    'Từ đồ thị, em nhận thấy giả thuyết ban đầu của em là:';

  const hypEval = evaluateHypothesisConsistency(userHypothesis);

  if (!selectedAnswer || selectedAnswer === 'Chọn kết luận...') {
    return {
      id: 'q1',
      questionText: qText,
      selectedAnswer: '',
      expectedAnswer: hypEval.expectedConclusion,
      status: 'unanswered',
      feedbackText: 'Em hãy chọn kết luận để đối chiếu giả thuyết ban đầu.',
      pdfTag: 'CHƯA TRẢ LỜI',
    };
  }

  // If hypothesis is ambiguous -> teacher review required
  if (hypEval.expectedConclusion === 'review_required') {
    return {
      id: 'q1',
      questionText: qText,
      selectedAnswer,
      expectedAnswer: 'Cần giáo viên đánh giá',
      status: 'review_required',
      feedbackText:
        'ℹ Cần giáo viên đánh giá: Giả thuyết ban đầu cần được giáo viên đối chiếu trực tiếp để xác định tính phù hợp với kết luận thực nghiệm.',
      pdfTag:
        'CẦN GIÁO VIÊN ĐÁNH GIÁ — Chưa đủ cơ sở để tự động kết luận giả thuyết ban đầu chính xác hay chưa chính xác.',
    };
  }

  const isMatch = selectedAnswer === hypEval.expectedConclusion;

  if (isMatch) {
    return {
      id: 'q1',
      questionText: qText,
      selectedAnswer,
      expectedAnswer: hypEval.expectedConclusion,
      status: 'correct',
      feedbackText:
        '✓ Chính xác! Kết luận của em phù hợp với giả thuyết ban đầu và kết quả thực nghiệm.',
      pdfTag: '✓ ĐÚNG — Em đã đánh giá phù hợp giả thuyết ban đầu.',
    };
  }

  return {
    id: 'q1',
    questionText: qText,
    selectedAnswer,
    expectedAnswer: hypEval.expectedConclusion,
    status: 'incorrect',
    feedbackText:
      '✗ Chưa chính xác. Hãy đối chiếu lại giả thuyết ban đầu với đồ thị biên độ theo tần số để xem xét kết luận.',
    correctAnswerDisplay: hypEval.expectedConclusion,
    pdfTag: '✗ SAI — Đáp án của em chưa phù hợp với kết quả thực nghiệm.',
    pdfCorrection: `Đáp án phù hợp: ${hypEval.expectedConclusion}`,
  };
}

/**
 * Question 2 Assessment
 * Evaluates the safety recommendation to reduce resonance.
 */
export function evaluateQuestion2(selectedAnswer: string): QuestionAssessment {
  const qText =
    'Đề xuất giải pháp: Để hạn chế hiện tượng cộng hưởng do tác động tuần hoàn, em đề xuất chỉ huy ra lệnh:';
  const CORRECT_ANSWER = 'Không đi đều và bắt đầu đi tự do';

  if (!selectedAnswer || selectedAnswer === 'Chọn phương án...') {
    return {
      id: 'q2',
      questionText: qText,
      selectedAnswer: '',
      expectedAnswer: CORRECT_ANSWER,
      status: 'unanswered',
      feedbackText: 'Em hãy chọn phương án giải pháp an toàn.',
      pdfTag: 'CHƯA TRẢ LỜI',
    };
  }

  if (selectedAnswer === CORRECT_ANSWER) {
    return {
      id: 'q2',
      questionText: qText,
      selectedAnswer,
      expectedAnswer: CORRECT_ANSWER,
      status: 'correct',
      feedbackText:
        '✓ Chính xác! Chuyển sang đi tự do giúp giảm tác động tuần hoàn đồng bộ trong mô hình, qua đó hạn chế sự gia tăng biên độ do cộng hưởng.',
      pdfTag:
        '✓ ĐÚNG — Phương án phù hợp với nguyên lí giảm tác động tuần hoàn đồng bộ trong mô hình.',
    };
  }

  return {
    id: 'q2',
    questionText: qText,
    selectedAnswer,
    expectedAnswer: CORRECT_ANSWER,
    status: 'incorrect',
    feedbackText:
      '✗ Chưa chính xác. Thay đổi tốc độ nhưng vẫn bước đồng bộ không bảo đảm tránh được cộng hưởng. Hãy chọn phương án làm giảm tính đồng bộ của tác động tuần hoàn.',
    correctAnswerDisplay: CORRECT_ANSWER,
    pdfTag: '✗ SAI — Việc tiếp tục bước đồng bộ không bảo đảm tránh được cộng hưởng.',
    pdfCorrection: `Đáp án đúng: ${CORRECT_ANSWER}`,
  };
}

/**
 * Question 3 Assessment (Optional Scaffolded Reflection)
 */
export function evaluateQuestion3(reflection: string): QuestionAssessment {
  const qText = 'Câu 3. Điều em rút ra sau bài thí nghiệm (Không bắt buộc)';
  const trimmed = reflection ? reflection.trim() : '';

  return {
    id: 'q3',
    questionText: qText,
    selectedAnswer: trimmed,
    expectedAnswer: '',
    status: trimmed ? 'correct' : 'unanswered',
    feedbackText: trimmed
      ? 'Đã ghi nhận ý kiến phản ánh khoa học của em.'
      : 'Chưa có câu trả lời — câu hỏi tự phản ánh không bắt buộc.',
    pdfTag: trimmed
      ? trimmed
      : 'Chưa có câu trả lời — câu hỏi tự phản ánh không bắt buộc.',
  };
}

/**
 * Builds the complete unified assessment report
 */
export function buildAssessmentReport(
  answers: ReportAnswers,
  userHypothesis: string
): FullAssessmentReport {
  const hypEval = evaluateHypothesisConsistency(userHypothesis);
  const q1 = evaluateQuestion1(answers.conclusionAnswer, userHypothesis);
  const q2 = evaluateQuestion2(answers.solutionAnswer);
  const q3 = evaluateQuestion3(answers.reflection);

  return {
    q1,
    q2,
    q3,
    hypothesisClassification: hypEval.classification,
    hypothesisReasoning: hypEval.reason,
  };
}
