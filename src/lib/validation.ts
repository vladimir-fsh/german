import { skillIds, type AISpeakingFeedback, type AIWritingFeedback, type Exercise, type ExerciseAttempt, type Lesson, type UserProgress, type VocabularyItem } from "@/lib/types";

export class ValidationError extends Error { constructor(message = "Некорректные данные. Проверьте формат файла или запроса.") { super(message); } }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => ["__proto__", "constructor", "prototype"].includes(key))) throw new ValidationError();
  return result;
}
export function string(value: unknown, max = 12000, min = 0): asserts value is string {
  if (typeof value !== "string" || value.length > max || value.trim().length < min) throw new ValidationError();
}
export function number(value: unknown, min = 0, max = 1000000): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < min || value > max) throw new ValidationError();
}
export function choice(value: unknown, choices: readonly unknown[]) { if (!choices.includes(value)) throw new ValidationError(); }
export function array(value: unknown, max = 10000): unknown[] { if (!Array.isArray(value) || value.length > max) throw new ValidationError(); return value; }
export function strings(value: unknown, max = 10000, length = 12000): string[] { return array(value, max).map((item) => { string(item, length); return item; }); }
export function date(value: unknown, timestamp = false) {
  string(value, 40, 10);
  if (!(timestamp ? /^\d{4}-\d\d-\d\dT/ : /^\d{4}-\d\d-\d\d$/).test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10)) throw new ValidationError();
}
const optional = (value: unknown, check: (value: unknown) => void) => { if (value !== undefined) check(value); };
export const topics = ["Alltag", "Arbeit", "Prüfung", "Wohnen", "Termine", "Gesundheit", "Familie", "Freizeit", "Reisen", "Umwelt"] as const;
export function validateVocabulary(value: unknown): VocabularyItem {
  const item = object(value);
  string(item.id, 200, 1); if (["__proto__", "constructor", "prototype"].includes(item.id)) throw new ValidationError(); string(item.german, 200, 1); string(item.russian, 500, 1); string(item.exampleSentence, 2000, 1);
  choice(item.topic, topics); choice(item.difficulty, ["A2", "B1"]);
  for (const key of ["plural", "verbForms", "construction", "sense"]) optional(item[key], (value) => string(value, 500));
  optional(item.lastReviewedAt, (value) => date(value, true)); optional(item.reviewCount, number); optional(item.confidence, (value) => number(value, 1, 5));
  return value as VocabularyItem;
}
export function validateExercise(value: unknown): Exercise {
  const item = object(value);
  string(item.id, 200, 1); if (["__proto__", "constructor", "prototype"].includes(item.id)) throw new ValidationError(); string(item.promptRu, 4000, 1); string(item.answer, 4000, 1); string(item.explanationRu, 4000, 1);
  choice(item.type, ["fill-blank", "translation", "free-writing", "reading"]);
  for (const key of ["promptDe", "sentence", "hint"]) optional(item[key], (value) => string(value, 4000));
  optional(item.acceptableAnswers, (value) => strings(value, 20, 4000)); optional(item.options, (value) => strings(value, 10, 1000));
  optional(item.skillId, (value) => choice(value, skillIds));
  return value as Exercise;
}
export function validateLesson(value: unknown): Lesson {
  const item = object(value);
  string(item.id, 200, 1); if (["__proto__", "constructor", "prototype"].includes(item.id)) throw new ValidationError(); string(item.title, 500, 1); choice(item.level, ["A2", "B1"]); choice(item.topic, topics);
  number(item.studyDay, 1); number(item.estimatedMinutes, 1, 180); string(item.warmUpReview, 4000); strings(item.vocabularyIds, 100, 200);
  optional(item.vocabularyItems, (value) => { const items = array(value, 30).map(validateVocabulary); if (new Set(items.map((item) => item.id)).size !== items.length) throw new ValidationError(); });
  const grammar = object(item.grammar); string(grammar.title, 500, 1); string(grammar.explanationRu, 8000, 1); strings(grammar.examples, 20, 4000);
  const exercises = array(item.exercises, 30).map(validateExercise);
  if (!exercises.length || new Set(exercises.map((exercise) => exercise.id)).size !== exercises.length || exercises.some((exercise) => exercise.id === "freePrompt")) throw new ValidationError();
  string(item.freePromptRu, 4000, 1);
  for (const key of ["readingText", "speakingPromptDe"]) optional(item[key], (value) => string(value));
  optional(item.successCriteria, (value) => strings(value, 20, 1000)); optional(item.generatedAt, (value) => date(value, true));
  optional(item.source, (value) => choice(value, ["ai", "fallback"])); optional(item.skillId, (value) => choice(value, skillIds));
  optional(item.kind, (value) => choice(value, ["lesson", "diagnostic", "checkpoint"])); optional(item.examId, (value) => choice(value, ["goethe-b1", "telc-b1"])); optional(item.timeLimitMinutes, (value) => number(value, 1, 180));
  return value as Lesson;
}
export function validateWritingFeedback(value: unknown): AIWritingFeedback {
  const item = object(value);
  string(item.correctedText); choice(item.levelEstimate, ["A2", "B1", null]); number(item.score, 0, 10);
  strings(item.strengths, 20, 2000); strings(item.grammarTipsRu, 20, 2000); string(item.nextPracticeRu, 4000);
  array(item.corrections, 30).forEach((entry) => { const correction = object(entry); for (const key of ["original", "corrected", "explanationRu"]) string(correction[key], 4000, 1); optional(correction.skillId, (value) => choice(value, skillIds)); optional(correction.kind, (value) => choice(value, ["error", "style"])); });
  optional(item.assessmentNoteRu, (value) => string(value, 4000));
  optional(item.rubric, (value) => {
    const items = array(value, 5);
    if (items.length !== 5 || new Set(items.map((entry) => object(entry).criterion)).size !== 5) throw new ValidationError();
    items.forEach((entry) => { const criterion = object(entry); choice(criterion.criterion, ["task", "coherence", "register", "vocabulary", "grammar"]); number(criterion.score, 0, 3); string(criterion.explanationRu, 2000, 1); });
  });
  return value as AIWritingFeedback;
}
export function validateSpeakingFeedback(value: unknown): AISpeakingFeedback {
  const item = object(value);
  validateWritingFeedback({ ...item, correctedText: item.correctedTranscript, grammarTipsRu: item.speakingTipsRu });
  strings(item.examTipsRu, 20, 2000); string(item.followUpQuestionDe, 2000, 1);
  return value as AISpeakingFeedback;
}
function answers(value: unknown) { for (const [key, answer] of Object.entries(object(value))) { string(key, 200, 1); string(answer); } }
export function validateCheck(value: unknown): ExerciseAttempt {
  const item = object(value); string(item.exerciseId, 200, 1); string(item.answer); string(item.corrected, 4000); string(item.explanationRu, 4000);
  choice(item.verdict, ["correct", "incorrect", "capitalization", "needs-review"]); choice(item.skillId, skillIds);
  if (typeof item.usedHint !== "boolean") throw new ValidationError(); date(item.checkedAt, true);
  return value as ExerciseAttempt;
}
function checks(value: unknown) { for (const [id, attempts] of Object.entries(object(value))) { array(attempts, 100).forEach((entry) => { if (validateCheck(entry).exerciseId !== id) throw new ValidationError(); }); } }
function result(value: unknown) {
  const item = object(value); string(item.lessonId, 200, 1); date(item.completedAt, true); date(item.completedDate); answers(item.exerciseAnswers);
  optional(item.id, (value) => string(value, 200, 1)); optional(item.title, (value) => string(value, 500)); optional(item.skillId, (value) => choice(value, skillIds));
  optional(item.kind, (value) => choice(value, ["lesson", "diagnostic", "checkpoint"])); optional(item.checks, checks); optional(item.feedback, validateWritingFeedback); optional(item.elapsedSeconds, (value) => number(value, 0, 31536000));
}
export function validateProgress(value: unknown): Record<string, unknown> {
  const item = object(value); choice(item.version, [1, 2]);
  string(item.studyTime, 5); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.studyTime)) throw new ValidationError();
  date(item.startDate); strings(item.completedDates).forEach((value) => date(value)); strings(item.completedLessonIds, 10000, 200);
  for (const key of ["totalCompletedLessons", "currentStreak", "bestStreak"]) number(item[key]);
  if (item.lastCompletedDate !== null) date(item.lastCompletedDate);
  for (const value of Object.values(object(item.postponedLessons))) date(value);
  for (const [id, value] of Object.entries(object(item.lessonResults))) { result(value); if (object(value).lessonId !== id) throw new ValidationError(); }
  for (const [id, value] of Object.entries(object(item.reviewState))) {
    const state = object(value); if (state.vocabularyId !== id) throw new ValidationError();
    if (state.lastReviewedAt !== null) date(state.lastReviewedAt, true); number(state.reviewCount); number(state.confidence, 1, 5);
    date(state.dueAt, typeof state.dueAt === "string" && state.dueAt.length > 10);
    if (item.version === 2) { choice(state.stage, ["new", "learning", "review"]); number(state.intervalDays, 0, 365); number(state.successes); number(state.lapses); choice(state.direction, ["produce", "recognize"]); if (state.introducedAt !== null) date(state.introducedAt, true); }
  }
  optional(item.generatedLessons, (value) => { const entries = Object.entries(object(value)); if (entries.length > 1000) throw new ValidationError(); for (const [id, lesson] of entries) if (validateLesson(lesson).id !== id) throw new ValidationError(); });
  if (item.currentGeneratedLessonId !== null && item.currentGeneratedLessonId !== undefined) string(item.currentGeneratedLessonId, 200, 1);
  optional(item.mistakeLog, (value) => array(value, 5000).forEach((entry) => {
    const mistake = object(entry); for (const key of ["id", "lessonId", "category", "original", "corrected", "explanationRu"]) string(mistake[key], 4000, key === "original" ? 0 : 1);
    date(mistake.createdAt, true); choice(mistake.source, ["writing", "speaking", "exercise"]);
    if (item.version === 2) { choice(mistake.skillId, skillIds); date(mistake.dueAt); choice(mistake.status, ["open", "corrected", "retained"]); strings(mistake.successfulDates).forEach((value) => date(value)); }
  }));
  if (item.version === 2) {
    choice(item.examId, ["goethe-b1", "telc-b1"]); choice(item.targetLevel, ["A2", "B1"]); strings(item.preferredTopics, 10, 100).forEach((value) => choice(value, topics));
    for (const [id, entry] of Object.entries(object(item.customVocabulary))) if (validateVocabulary(entry).id !== id) throw new ValidationError();
    for (const value of Object.values(object(item.drafts))) {
      const draft = object(value); answers(draft.answers); checks(draft.checks); strings(draft.revealedIds, 100, 200); date(draft.startedAt, true); date(draft.updatedAt, true);
      optional(draft.feedback, validateWritingFeedback); optional(draft.feedbackAnswer, (value) => string(value));
      optional(draft.writingHistory, (value) => array(value, 100).forEach((entry) => { const review = object(entry); string(review.answer); validateWritingFeedback(review.feedback); date(review.checkedAt, true); }));
    }
    array(item.attempts, 10000).forEach(result);
    const evidence = object(item.skillEvidence);
    for (const id of skillIds) array(evidence[id], 10000).forEach((entry) => { const proof = object(entry); date(proof.date); string(proof.lessonId, 200, 1); if (typeof proof.successful !== "boolean") throw new ValidationError(); choice(proof.source, ["exercise", "writing"]); optional(proof.taskKey, (value) => string(value)); });
    if (item.diagnosticCompletedAt !== null) date(item.diagnosticCompletedAt, true);
    optional(item.mistakePracticeDrafts, (value) => {
      for (const entry of Object.values(object(value))) {
        const draft = object(entry); string(draft.exerciseId, 500, 1); string(draft.answer, 4000); date(draft.updatedAt, true);
        if (typeof draft.usedHint !== "boolean") throw new ValidationError();
        array(draft.attempts, 100).forEach((value) => { if (validateCheck(value).exerciseId !== draft.exerciseId) throw new ValidationError(); });
      }
    });
    optional(item.speakingPractice, (value) => {
      const practice = object(value); number(practice.promptIndex, 0, 3); string(practice.transcript);
      if (practice.followUpQuestion !== null) string(practice.followUpQuestion, 2000, 1);
      array(practice.history, 100).forEach((entry) => { const turn = object(entry); string(turn.promptDe, 4000, 1); string(turn.transcript); validateSpeakingFeedback(turn.feedback); date(turn.checkedAt, true); });
    });
  }
  return item;
}

export function assertProgressLinks(progress: UserProgress) {
  if (Object.keys(progress.mistakePracticeDrafts).some((id) => !progress.mistakeLog.some((item) => item.id === id))) throw new ValidationError("Черновик исправления ссылается на неизвестную ошибку.");
  if (progress.currentGeneratedLessonId && !progress.generatedLessons[progress.currentGeneratedLessonId]) throw new ValidationError("Текущий урок отсутствует в файле.");
  for (const [id, draft] of Object.entries(progress.drafts)) {
    const lesson = progress.generatedLessons[id];
    if (!lesson) throw new ValidationError("Черновик ссылается на отсутствующий урок.");
    const ids = new Set(["freePrompt", ...lesson.exercises.map((item) => item.id)]);
    if ([...Object.keys(draft.answers), ...Object.keys(draft.checks), ...draft.revealedIds].some((key) => !ids.has(key))) throw new ValidationError("Черновик содержит неизвестное упражнение.");
  }
}
