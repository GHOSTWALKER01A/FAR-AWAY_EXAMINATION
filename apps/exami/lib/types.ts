// Domain types mirroring the NestJS core-api responses.

export type Role = "ADMIN" | "EXAMINER" | "INVIGILATOR" | "CANDIDATE";

export type ExamMode = "ADAPTIVE" | "FIXED" | "RANDOMISED";
export type ExamStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "LIVE"
  | "CLOSED"
  | "RESULTS_PUBLISHED"
  | "CANCELLED";

// Must match backend Prisma enum exactly
export type RegistrationType = "PRE_REGISTERED" | "OPEN";

// Must match backend Prisma enum exactly (MULTI_SELECT, not MULTI)
export type QuestionType =
  | "MCQ"
  | "MULTI_SELECT"
  | "SHORT"
  | "LONG"
  | "NUMERIC"
  | "CODE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type CalibrationStatus = "UNCALIBRATED" | "FIELD_TEST" | "CALIBRATED";

export type EnrolmentStatus =
  | "ENROLLED"
  | "WAITLISTED"
  | "ABSENT"
  | "CANCELLED";

export type RiskBucket = "LOW" | "MEDIUM" | "HIGH";

/** Generic paginated API response (list endpoints wrap their payload in this). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: number; message: string };
  timestamp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Fields decoded from the JWT access token. Must stay in sync with auth.service.ts issueTokens(). */
export interface JwtClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  institutionId: string;
  perms?: string[];
  exp: number;
  iat: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  institutionId: string;
  emailVerified: boolean;
  permissions: string[];
  createdAt?: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface ExamSection {
  id: string;
  examId: string;
  title: string;
  order: number;
  durationSeconds?: number;
  markingConfig?: Record<string, unknown>;
  _count?: { examQuestions: number };
}

export interface ExamQuestion {
  examId: string;
  questionId: string;
  order: number;
  weight: number;
  sectionId?: string;
  question: Question;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  mode: ExamMode;
  status: ExamStatus;
  registrationType: RegistrationType;
  durationSeconds: number;
  startAt?: string;
  endAt?: string;
  publishAt?: string;
  seatCap?: number;
  enrolledCount?: number;
  markingConfig?: Record<string, unknown>;
  adaptiveConfig?: Record<string, unknown>;
  proctoringConfig?: Record<string, unknown>;
  blueprint?: Record<string, unknown>;
  sections?: ExamSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  rootId?: string;
  version?: number;
  isLatest?: boolean;
  type: QuestionType;
  stem: string;
  options?: Option[];
  correctKey?: { optionIds?: string[]; value?: number; text?: string };
  marks: number;
  difficulty: Difficulty;
  topicTags?: string[];
  rubric?: { criteria: { criterion: string; max: number }[] };
  calibrationStatus?: CalibrationStatus;
  responseCount?: number;
  exposureCount?: number;
  provenance?: "MANUAL" | "BULK" | "AI";
  irtA?: number;
  irtB?: number;
  irtC?: number;
}

export interface QuestionDraft {
  stem: string;
  type: QuestionType;
  options?: Option[];
  correctKey?: { optionIds?: string[] };
  difficulty: Difficulty;
  marks?: number;
  rubric?: Question["rubric"];
  provenance: "AI";
}

export interface Enrolment {
  id: string;
  status: EnrolmentStatus;
  user: Pick<User, "id" | "name" | "email">;
  slotAt?: string;
}

export interface NextItem {
  id?: string;
  stem?: string;
  type?: QuestionType;
  options?: Option[];
  marks?: number;
  difficulty?: Difficulty;
  done: boolean;
  theta?: number;
  se?: number;
}

export interface SessionStart {
  sessionId: string;
  deadlineAt: string;
  remainingSeconds: number;
}

export interface ResumeInfo {
  sessionId: string;
  remainingSeconds: number;
  answeredCount: number;
}

export interface ProctorEvent {
  type: string;
  severity: number;
  confidence: number;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface LiveSession {
  sessionId: string;
  userId: string;
  userName?: string;
  score: number;
  bucket: RiskBucket;
  latest?: ProctorEvent[];
  flagged?: boolean;
}

export interface EvaluationItem {
  id: string;
  confidence: number;
  awarded: number;
  maxMarks: number;
  status: "PENDING" | "SUGGESTED" | "APPROVED" | "OVERRIDDEN";
  criteria: {
    criterion: string;
    awarded: number;
    max: number;
    justification?: string;
  }[];
  response: {
    answer: unknown;
    question: { stem: string; marks: number; rubric?: unknown };
  };
}

export interface ScoreRow {
  rank: number;
  percentile: number;
  totalMarks: number;
  maxMarks: number;
  session: { id: string; user: { name: string; email: string } };
}

export interface ReportItem {
  questionId: string;
  stem: string;
  type: QuestionType;
  yourAnswer: unknown;
  correct?: boolean;
  awarded: number;
  marks: number;
  rubricBreakdown?: EvaluationItem["criteria"];
  justification?: string;
}

export interface Report {
  sessionId?: string;
  result?: { totalMarks: number; maxMarks: number; rank?: number; percentile?: number };
  responses?: {
    questionId: string;
    answer: unknown;
    isCorrect?: boolean;
    awardedMarks?: number;
    question: { stem: string; marks: number; type: string };
    evaluations?: EvaluationItem[];
  }[];
}

export interface Grievance {
  id: string;
  status: "OPEN" | "UPHELD" | "REJECTED";
  reason: string;
  questionId: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  result?: { session?: { user?: { name: string } } };
}
