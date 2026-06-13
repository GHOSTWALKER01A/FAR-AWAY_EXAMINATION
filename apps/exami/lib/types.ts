// Domain types mirroring the NestJS core-api responses.
// These intentionally stay loose where the backend returns Json blobs.

export type Role = "ADMIN" | "EXAMINER" | "INVIGILATOR" | "CANDIDATE";

export type ExamMode = "ADAPTIVE" | "FIXED" | "RANDOMISED";
export type ExamStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "LIVE"
  | "CLOSED"
  | "RESULTS_PUBLISHED";
export type RegistrationType = "PRE_REGISTERED" | "SELF_REGISTER" | "OPEN";

export type QuestionType =
  | "MCQ"
  | "MULTI"
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

export interface JwtClaims {
  sub: string;
  email: string;
  role: Role;
  institutionId: string;
  permissions?: string[];
  name?: string;
  exp: number;
  iat: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Option {
  id: string;
  text: string;
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
}

export interface ExamSection {
  id: string;
  title: string;
  durationSeconds?: number;
}

export interface Question {
  id: string;
  rootId?: string;
  version?: number;
  type: QuestionType;
  stem: string;
  options?: Option[];
  marks: number;
  difficulty: Difficulty;
  topicTags?: string[];
  rubric?: { criteria: { criterion: string; max: number }[] };
  calibrationStatus?: CalibrationStatus;
  usageCount?: number;
  provenance?: "HUMAN" | "AI";
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
  user: User;
  slotAt?: string;
}

export interface NextItem {
  id: string;
  stem: string;
  type: QuestionType;
  options?: Option[];
  marks: number;
  difficulty: Difficulty;
  done?: boolean;
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
  criteria: {
    criterion: string;
    awarded: number;
    max: number;
    justification?: string;
  }[];
  response: {
    answer: { text?: string };
    question: { stem: string; marks: number };
  };
}

export interface ScoreRow {
  rank: number;
  percentile: number;
  totalMarks: number;
  maxMarks: number;
  session: { id?: string; user: { name: string } };
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
  sessionId: string;
  totalMarks: number;
  maxMarks: number;
  rank?: number;
  percentile?: number;
  items: ReportItem[];
}

export interface Grievance {
  id: string;
  status: "OPEN" | "UPHELD" | "REJECTED";
  reason: string;
  questionId: string;
  createdAt: string;
  user?: { name: string };
  question?: { stem: string };
}
