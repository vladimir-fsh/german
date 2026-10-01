export type Level = "A2" | "B1";

export type VocabularyTopic =
  | "Alltag"
  | "Arbeit"
  | "Prüfung"
  | "Wohnen"
  | "Termine"
  | "Gesundheit"
  | "Familie"
  | "Freizeit"
  | "Reisen"
  | "Umwelt";

export const skillIds = ["word-order", "cases", "past", "reasons", "requests", "opinions", "planning", "reading", "writing"] as const;
export type SkillId = typeof skillIds[number];
export type ExamId = "goethe-b1" | "telc-b1";
export type ExerciseType = "fill-blank" | "translation" | "free-writing" | "reading";

export type Exercise = {
  id: string;
  type: ExerciseType;
  promptRu: string;
  promptDe?: string;
  sentence?: string;
  answer: string;
  acceptableAnswers?: string[];
  explanationRu: string;
  hint?: string;
  skillId?: SkillId;
  options?: string[];
};

export type VocabularyItem = {
  id: string;
  topic: VocabularyTopic;
  german: string;
  russian: string;
  exampleSentence: string;
  difficulty: Level;
  lastReviewedAt?: string;
  reviewCount?: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
  plural?: string;
  verbForms?: string;
  construction?: string;
  sense?: string;
};

export type GrammarMiniBlock = {
  title: string;
  explanationRu: string;
  examples: string[];
};

export type Lesson = {
  id: string;
  title: string;
  level: Level;
  topic: VocabularyTopic;
  studyDay: number;
  estimatedMinutes: number;
  warmUpReview: string;
  vocabularyIds: string[];
  vocabularyItems?: VocabularyItem[];
  grammar: GrammarMiniBlock;
  readingText?: string;
  exercises: Exercise[];
  freePromptRu: string;
  speakingPromptDe?: string;
  successCriteria?: string[];
  generatedAt?: string;
  source?: "ai" | "fallback";
  skillId?: SkillId;
  kind?: "lesson" | "diagnostic" | "checkpoint";
  examId?: ExamId;
  timeLimitMinutes?: number;
};

export type ReviewState = {
  vocabularyId: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  dueAt: string;
  stage: "new" | "learning" | "review";
  intervalDays: number;
  successes: number;
  lapses: number;
  direction: "produce" | "recognize";
  introducedAt: string | null;
};

export type LessonResult = {
  lessonId: string;
  completedAt: string;
  completedDate: string;
  exerciseAnswers: Record<string, string>;
  id?: string;
  title?: string;
  skillId?: SkillId;
  kind?: Lesson["kind"];
  checks?: Record<string, ExerciseAttempt[]>;
  feedback?: AIWritingFeedback;
  elapsedSeconds?: number;
};

export type ExerciseVerdict = "correct" | "incorrect" | "capitalization" | "needs-review";
export type ExerciseAttempt = {
  exerciseId: string;
  answer: string;
  verdict: ExerciseVerdict;
  explanationRu: string;
  corrected: string;
  skillId: SkillId;
  usedHint: boolean;
  checkedAt: string;
};
export type LessonDraft = {
  answers: Record<string, string>;
  checks: Record<string, ExerciseAttempt[]>;
  revealedIds: string[];
  feedback?: AIWritingFeedback;
  feedbackAnswer?: string;
  writingHistory?: Array<{ answer: string; feedback: AIWritingFeedback; checkedAt: string }>;
  startedAt: string;
  updatedAt: string;
};
export type SkillEvidence = { date: string; lessonId: string; successful: boolean; source: "exercise" | "writing"; taskKey?: string };
export type MistakePracticeDraft = { exerciseId: string; answer: string; usedHint: boolean; attempts: ExerciseAttempt[]; updatedAt: string };

export type AIWritingFeedback = {
  correctedText: string;
  levelEstimate: Level | null;
  score: number;
  strengths: string[];
  corrections: Array<{
    original: string;
    corrected: string;
    explanationRu: string;
    skillId?: SkillId;
    kind?: "error" | "style";
  }>;
  grammarTipsRu: string[];
  nextPracticeRu: string;
  rubric?: Array<{ criterion: "task" | "coherence" | "register" | "vocabulary" | "grammar"; score: number; explanationRu: string }>;
  assessmentNoteRu?: string;
};

export type MistakeLogItem = {
  id: string;
  lessonId: string;
  createdAt: string;
  source: "writing" | "speaking" | "exercise";
  category: string;
  original: string;
  corrected: string;
  explanationRu: string;
  skillId: SkillId;
  dueAt: string;
  status: "open" | "corrected" | "retained";
  successfulDates: string[];
};

export type AISpeakingFeedback = {
  correctedTranscript: string;
  levelEstimate: Level | null;
  score: number;
  strengths: string[];
  corrections: Array<{
    original: string;
    corrected: string;
    explanationRu: string;
    skillId?: SkillId;
    kind?: "error" | "style";
  }>;
  speakingTipsRu: string[];
  examTipsRu: string[];
  followUpQuestionDe: string;
  nextPracticeRu: string;
};

export type UserProgress = {
  version: 2;
  studyTime: string;
  startDate: string;
  completedDates: string[];
  completedLessonIds: string[];
  totalCompletedLessons: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  postponedLessons: Record<string, string>;
  lessonResults: Record<string, LessonResult>;
  reviewState: Record<string, ReviewState>;
  generatedLessons: Record<string, Lesson>;
  currentGeneratedLessonId: string | null;
  mistakeLog: MistakeLogItem[];
  examId: ExamId;
  targetLevel: Level;
  preferredTopics: VocabularyTopic[];
  customVocabulary: Record<string, VocabularyItem>;
  drafts: Record<string, LessonDraft>;
  attempts: LessonResult[];
  skillEvidence: Record<SkillId, SkillEvidence[]>;
  diagnosticCompletedAt: string | null;
  mistakePracticeDrafts: Record<string, MistakePracticeDraft>;
  speakingPractice: {
    promptIndex: number;
    transcript: string;
    followUpQuestion: string | null;
    history: Array<{ promptDe: string; transcript: string; feedback: AISpeakingFeedback; checkedAt: string }>;
  };
};
