import { vocabulary } from "@/lib/seed";
import { previousStudyDate } from "@/lib/schedule";
import { normalizeAnswer } from "@/lib/answers";
import { skillIds, type AIWritingFeedback, type ExerciseAttempt, type Lesson, type LessonDraft, type LessonResult, type MistakeLogItem, type ReviewState, type UserProgress, type VocabularyItem } from "@/lib/types";
import { assertProgressLinks, ValidationError, validateLesson, validateProgress, validateWritingFeedback } from "@/lib/validation";
import { toISODate } from "@/lib/utils";

// Keep the original key so existing installations are migrated without losing data.
export const PROGRESS_STORAGE_KEY = "german-b1-progress-v1";
export const MAX_NEW_WORDS_PER_DAY = 5;
export function newReviewState(id: string, date = new Date()): ReviewState {
  return { vocabularyId: id, lastReviewedAt: null, reviewCount: 0, confidence: 1, dueAt: date.toISOString(), stage: "new", intervalDays: 0, successes: 0, lapses: 0, direction: "produce", introducedAt: null };
}
export function createDefaultProgress(date = new Date()): UserProgress {
  return {
    version: 2, studyTime: "06:00", startDate: toISODate(date), completedDates: [], completedLessonIds: [], totalCompletedLessons: 0,
    currentStreak: 0, bestStreak: 0, lastCompletedDate: null, postponedLessons: {}, lessonResults: {}, generatedLessons: {}, currentGeneratedLessonId: null,
    mistakeLog: [], reviewState: Object.fromEntries(vocabulary.map((item) => [item.id, newReviewState(item.id, date)])),
    examId: "goethe-b1", targetLevel: "A2", preferredTopics: ["Termine", "Arbeit", "Gesundheit", "Freizeit"], customVocabulary: {}, drafts: {}, attempts: [],
    skillEvidence: { "word-order": [], cases: [], past: [], reasons: [], requests: [], opinions: [], planning: [], reading: [], writing: [] }, diagnosticCompletedAt: null, mistakePracticeDrafts: {}, speakingPractice: { promptIndex: 0, transcript: "", followUpQuestion: null, history: [] },
  };
}
export function getVocabularyCatalog(progress: UserProgress): Record<string, VocabularyItem> {
  return Object.fromEntries([...vocabulary, ...Object.values(progress.customVocabulary)].map((item) => [item.id, item]));
}
const lexicalKey = (item: VocabularyItem) => `${normalizeAnswer(item.german, true)}|${item.sense?.trim().toLowerCase() ?? ""}`;
function stableId(value: string) { let hash = 2166136261; for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return `word-${(hash >>> 0).toString(36)}`; }
export function saveGeneratedLesson(progress: UserProgress, input: Lesson, date = new Date(), archive = true): UserProgress {
  const lesson = validateLesson(input);
  const catalog = getVocabularyCatalog(progress);
  const customVocabulary = { ...progress.customVocabulary };
  const reviewState = { ...progress.reviewState };
  const items = (lesson.vocabularyItems ?? []).map((item) => {
    const existing = Object.values(catalog).find((word) => lexicalKey(word) === lexicalKey(item));
    let id = existing?.id ?? stableId(lexicalKey(item));
    // Protect an unlikely hash collision rather than replacing a different word.
    if (!existing) { let suffix = 0; while (catalog[id] && lexicalKey(catalog[id]) !== lexicalKey(item)) id = `${stableId(lexicalKey(item))}-${++suffix}`; }
    const merged = { ...existing, ...item, id };
    customVocabulary[id] = merged; catalog[id] = merged;
    reviewState[id] ??= newReviewState(id, date);
    return merged;
  });
  const stored = { ...lesson, vocabularyItems: items.length ? items : lesson.vocabularyItems, vocabularyIds: items.length ? [...new Set(items.map((item) => item.id))] : lesson.vocabularyIds };
  const generatedLessons = { ...progress.generatedLessons, [lesson.id]: stored };
  // Finished lessons retain their results and summaries in attempts. Keep full content for drafts and the latest 60 lessons.
  const protectedIds = new Set(Object.keys(progress.drafts).filter((id) => !progress.completedLessonIds.includes(id)));
  if (progress.currentGeneratedLessonId) protectedIds.add(progress.currentGeneratedLessonId);
  const retained = new Set(Object.keys(generatedLessons).slice(-60)); retained.add(lesson.id);
  for (const id of Object.keys(generatedLessons)) if (archive && !retained.has(id) && !protectedIds.has(id)) delete generatedLessons[id];
  const drafts = Object.fromEntries(Object.entries(progress.drafts).filter(([id]) => generatedLessons[id]));
  return { ...progress, currentGeneratedLessonId: lesson.id, generatedLessons, customVocabulary, reviewState, drafts };
}
export function streakStats(dates: string[], date = new Date()) {
  const unique = [...new Set(dates)].sort(); const today = toISODate(date);
  // Optional weekend practice neither breaks nor advances the weekday streak.
  const weekdays = unique.filter((day) => { const weekday = new Date(`${day}T12:00:00`).getDay(); return weekday >= 1 && weekday <= 5; });
  let run = 0; let best = 0; let previous: string | null = null;
  for (const day of weekdays) { run = previous === previousStudyDate(day) ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  const current = previous === today || previous === previousStudyDate(today) ? run : 0;
  return { currentStreak: current, bestStreak: best, lastCompletedDate: unique.at(-1) ?? null };
}
export function refreshProgress(progress: UserProgress, date = new Date()): UserProgress {
  return { ...progress, completedLessonIds: [...new Set(progress.completedLessonIds)], totalCompletedLessons: new Set(progress.completedLessonIds).size, ...streakStats(progress.completedDates, date) };
}
export function importProgressFromJson(json: string, date = new Date()): UserProgress {
  if (json.length > 10_000_000) throw new Error("Файл прогресса слишком большой.");
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { throw new ValidationError("Некорректный JSON. Текущий прогресс не изменен."); }
  const parsed = validateProgress(raw);
  const defaults = createDefaultProgress(date);
  let next = { ...defaults, ...parsed, version: 2 } as UserProgress;
  if (parsed.version === 1) {
    next.reviewState = Object.fromEntries(Object.entries(next.reviewState).map(([id, old]) => [id, { ...newReviewState(id, date), ...old, stage: old.reviewCount ? "review" : "new", introducedAt: old.lastReviewedAt, intervalDays: old.reviewCount ? 1 : 0, successes: 0, lapses: 0, direction: "produce" }]));
    next.mistakeLog = next.mistakeLog.map((item) => ({ ...item, skillId: "writing", category: "writing", dueAt: toISODate(date), status: "open", successfulDates: [] }));
    next.attempts = Object.values(next.lessonResults).map((item, index) => ({ ...item, id: `imported-${index}` }));
  }
  next.reviewState = { ...defaults.reviewState, ...next.reviewState };
  const oldCurrent = next.currentGeneratedLessonId;
  for (const lesson of Object.values(next.generatedLessons)) next = saveGeneratedLesson(next, lesson, date, false);
  next.currentGeneratedLessonId = oldCurrent;
  const catalog = getVocabularyCatalog(next);
  if (Object.keys(next.reviewState).some((id) => !catalog[id])) throw new Error("Повторение ссылается на слово, отсутствующее в словаре.");
  if (Object.values(next.generatedLessons).some((lesson) => lesson.vocabularyIds.some((id) => !catalog[id]))) throw new Error("В уроке есть неизвестные слова.");
  assertProgressLinks(next);
  return refreshProgress(next, date);
}
export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return createDefaultProgress();
  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  return raw ? importProgressFromJson(raw) : createDefaultProgress();
}
export function saveProgress(progress: UserProgress) { window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }
export function emptyDraft(date = new Date()): LessonDraft { const stamp = date.toISOString(); return { answers: {}, checks: {}, revealedIds: [], startedAt: stamp, updatedAt: stamp }; }
export function updateDraft(progress: UserProgress, lesson: Lesson, update: (draft: LessonDraft) => LessonDraft, date = new Date()): UserProgress {
  // Save the content together with its first draft; it remains stable when planner state changes.
  const prepared = progress.generatedLessons[lesson.id] ? progress : saveGeneratedLesson(progress, lesson, date);
  return { ...prepared, currentGeneratedLessonId: lesson.id, drafts: { ...prepared.drafts, [lesson.id]: { ...update(prepared.drafts[lesson.id] ?? emptyDraft(date)), updatedAt: date.toISOString() } } };
}
function addMistake(progress: UserProgress, item: Omit<MistakeLogItem, "id" | "dueAt" | "status" | "successfulDates">, date = new Date()): UserProgress {
  const same = progress.mistakeLog.find((old) => old.skillId === item.skillId && old.source === item.source && normalizeAnswer(old.original) === normalizeAnswer(item.original) && normalizeAnswer(old.corrected) === normalizeAnswer(item.corrected));
  if (same) {
    if (same.lessonId === item.lessonId && same.status === "open") return progress;
    return { ...progress, mistakePracticeDrafts: Object.fromEntries(Object.entries(progress.mistakePracticeDrafts).filter(([id]) => id !== same.id)), mistakeLog: progress.mistakeLog.map((old) => old.id === same.id ? { ...old, ...item, dueAt: toISODate(date), status: "open", successfulDates: [] } : old) };
  }
  const id = `mistake-${stableId(`${item.skillId}|${item.source}|${item.original}|${item.corrected}`)}`;
  return { ...progress, mistakeLog: [{ ...item, id, dueAt: toISODate(date), status: "open", successfulDates: [] }, ...progress.mistakeLog] };
}
export function recordExerciseAttempt(progress: UserProgress, lesson: Lesson, attempt: ExerciseAttempt, date = new Date()): UserProgress {
  let next = updateDraft(progress, lesson, (draft) => {
    const previous = draft.checks[attempt.exerciseId] ?? [];
    const unresolved = previous.findIndex((item) => item.answer === attempt.answer && item.verdict === "needs-review");
    const checks = unresolved >= 0 && attempt.verdict !== "needs-review"
      ? previous.map((item, index) => index === unresolved ? { ...attempt, checkedAt: item.checkedAt, usedHint: item.usedHint || attempt.usedHint } : item)
      : [...previous, attempt];
    // Preserve the first attempt even after repeated checking.
    const bounded = checks.length > 100 ? [checks[0], ...checks.slice(-99)] : checks;
    return { ...draft, checks: { ...draft.checks, [attempt.exerciseId]: bounded } };
  }, date);
  if (["incorrect", "capitalization"].includes(attempt.verdict)) next = addMistake(next, { lessonId: lesson.id, source: "exercise", skillId: attempt.skillId, category: attempt.skillId, original: attempt.answer, corrected: attempt.corrected, explanationRu: attempt.explanationRu, createdAt: date.toISOString() }, date);
  return next;
}
export function recordWritingFeedback(progress: UserProgress, lessonId: string, feedback: AIWritingFeedback, date = new Date(), answer?: string, source: "writing" | "speaking" = "writing"): UserProgress {
  validateWritingFeedback(feedback);
  let next = progress;
  const lesson = progress.generatedLessons[lessonId];
  if (lesson && answer !== undefined) {
    const activeId = next.currentGeneratedLessonId;
    next = updateDraft(next, lesson, (draft) => ({ ...draft, feedback, feedbackAnswer: answer, writingHistory: [...(draft.writingHistory ?? []), { answer, feedback, checkedAt: date.toISOString() }].slice(-100) }), date);
    next.currentGeneratedLessonId = activeId;
  }
  const completed = next.lessonResults[lessonId];
  if (answer !== undefined && completed?.exerciseAnswers.freePrompt === answer) {
    next = { ...next, lessonResults: { ...next.lessonResults, [lessonId]: { ...completed, feedback } }, attempts: next.attempts.map((attempt) => attempt.lessonId === lessonId && attempt.exerciseAnswers.freePrompt === answer ? { ...attempt, feedback } : attempt) };
  }
  for (const correction of feedback.corrections.filter((item) => item.kind !== "style")) next = addMistake(next, { lessonId, createdAt: date.toISOString(), source, category: correction.skillId ?? "writing", skillId: correction.skillId ?? "writing", original: correction.original, corrected: correction.corrected, explanationRu: correction.explanationRu }, date);
  return next;
}
export function lessonCompletionIssues(lesson: Lesson, draft: LessonDraft): string[] {
  const issues: string[] = [];
  if (lesson.exercises.some((exercise) => !draft.answers[exercise.id]?.trim())) issues.push("Сделайте попытку каждого упражнения.");
  if (lesson.exercises.some((exercise) => !draft.checks[exercise.id]?.some((check) => check.answer === draft.answers[exercise.id]))) issues.push("Проверьте текущие ответы упражнений.");
  if ((draft.answers.freePrompt?.trim().split(/\s+/).length ?? 0) < 20) issues.push("Напишите хотя бы 20 слов: этого достаточно для учебной попытки, но не для определения уровня.");
  return issues;
}
export function completeLesson(progress: UserProgress, lesson: Lesson, date = new Date()): UserProgress {
  const draft = progress.drafts[lesson.id] ?? emptyDraft(date);
  const issues = lessonCompletionIssues(lesson, draft); if (issues.length) throw new Error(issues.join(" "));
  if (progress.completedLessonIds.includes(lesson.id)) return progress;
  const result: LessonResult = { id: `attempt-${lesson.id}-${date.getTime()}`, lessonId: lesson.id, title: lesson.title, skillId: lesson.skillId, kind: lesson.kind, completedAt: date.toISOString(), completedDate: toISODate(date), exerciseAnswers: { ...draft.answers }, checks: draft.checks, feedback: draft.feedbackAnswer === draft.answers.freePrompt ? draft.feedback : undefined, elapsedSeconds: Math.max(0, Math.round((date.getTime() - new Date(draft.startedAt).getTime()) / 1000)) };
  const skillEvidence = { ...progress.skillEvidence };
  for (const skillId of skillIds) {
    const exercises = lesson.exercises.filter((exercise) => (exercise.skillId ?? lesson.skillId ?? "writing") === skillId);
    if (skillId === "writing") {
      const rubric = result.feedback?.rubric;
      if (rubric && !skillEvidence.writing.some((item) => item.date === toISODate(date))) {
        const successful = rubric.filter((item) => ["task", "coherence", "grammar"].includes(item.criterion)).every((item) => item.score >= 2);
        skillEvidence.writing = [...skillEvidence.writing, { lessonId: lesson.id, date: toISODate(date), successful, source: "writing", taskKey: lesson.freePromptRu }];
      }
      continue;
    }
    if (!exercises.length) continue;
    const successful = exercises.every((exercise) => { const first = draft.checks[exercise.id]?.[0]; return first?.verdict === "correct" && !first.usedHint; });
    // One observation per skill per day prevents repeated clicks from looking like retention.
    if (!skillEvidence[skillId].some((item) => item.date === toISODate(date))) skillEvidence[skillId] = [...skillEvidence[skillId], { lessonId: lesson.id, date: toISODate(date), successful, source: "exercise", taskKey: exercises.map((item) => item.promptRu).sort().join("|") }];
  }
  const next = refreshProgress({ ...progress, skillEvidence, completedDates: [...new Set([...progress.completedDates, toISODate(date)])].sort(), completedLessonIds: [...progress.completedLessonIds, lesson.id], attempts: [...progress.attempts, result], lessonResults: { ...progress.lessonResults, [lesson.id]: result }, diagnosticCompletedAt: lesson.kind === "diagnostic" ? date.toISOString() : progress.diagnosticCompletedAt }, date);
  return introduceVocabulary(next, lesson.vocabularyIds, date);
}
export function postponeLesson(progress: UserProgress, lessonId: string, until: string): UserProgress { return { ...progress, postponedLessons: { ...progress.postponedLessons, [lessonId]: until } }; }
export function updateStudyTime(progress: UserProgress, studyTime: string): UserProgress { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(studyTime)) throw new Error("Укажите время в формате ЧЧ:ММ."); return { ...progress, studyTime }; }
export function isVocabularyDue(state: ReviewState, date = new Date()) { return state.stage !== "new" && new Date(state.dueAt.length === 10 ? `${state.dueAt}T00:00:00` : state.dueAt).getTime() <= date.getTime(); }
export function introduceVocabulary(progress: UserProgress, ids: string[], date = new Date()): UserProgress {
  const today = toISODate(date);
  const introduced = Object.values(progress.reviewState).filter((state) => state.introducedAt && toISODate(new Date(state.introducedAt)) === today).length;
  const reviewState = { ...progress.reviewState }; let remaining = MAX_NEW_WORDS_PER_DAY - introduced;
  for (const id of ids) { if (remaining <= 0) break; const state = reviewState[id]; if (!state || state.stage !== "new") continue; reviewState[id] = { ...state, stage: "learning", dueAt: date.toISOString(), introducedAt: date.toISOString() }; remaining -= 1; }
  return { ...progress, reviewState };
}
export function markVocabularyKnowledge(progress: UserProgress, id: string, knows: boolean, date = new Date()): UserProgress {
  let next = progress;
  if (next.reviewState[id]?.stage === "new") next = introduceVocabulary(next, [id], date);
  const old = next.reviewState[id]; if (!old || !isVocabularyDue(old, date)) return next;
  const successes = knows ? old.successes + 1 : 0;
  const stage = !knows || (old.stage === "learning" && successes < 2) ? "learning" : "review";
  const intervalDays = stage === "learning" ? 0 : old.stage === "learning" ? 1 : Math.min(90, Math.max(1, Math.round(old.intervalDays * 2)));
  const due = new Date(date); if (stage === "learning") due.setMinutes(due.getMinutes() + (knows ? 10 : 1)); else due.setDate(due.getDate() + intervalDays);
  return { ...next, reviewState: { ...next.reviewState, [id]: { ...old, lastReviewedAt: date.toISOString(), reviewCount: old.reviewCount + 1, confidence: (knows ? Math.min(5, old.confidence + 1) : 1) as ReviewState["confidence"], stage, intervalDays, successes, lapses: old.lapses + (knows ? 0 : 1), dueAt: due.toISOString(), direction: knows && stage === "review" ? (old.direction === "produce" ? "recognize" : "produce") : "produce" } } };
}
export function reviewVocabulary(progress: UserProgress, id: string, confidence: 1 | 2 | 3 | 4 | 5, date = new Date()) { return markVocabularyKnowledge(progress, id, confidence >= 3, date); }
export function recordMistakePractice(progress: UserProgress, id: string, success: boolean, date = new Date()): UserProgress {
  const today = toISODate(date);
  return { ...progress, mistakePracticeDrafts: Object.fromEntries(Object.entries(progress.mistakePracticeDrafts).filter(([key]) => key !== id)), mistakeLog: progress.mistakeLog.map((item) => {
    if (item.id !== id) return item;
    const successfulDates = success ? [...new Set([...item.successfulDates, today])].sort() : [];
    const retained = successfulDates.length >= 2 && new Date(today).getTime() - new Date(successfulDates[0]).getTime() >= 3 * 86400000;
    const due = new Date(date); due.setDate(due.getDate() + (success ? retained ? 14 : 3 : 1));
    return { ...item, successfulDates, status: retained ? "retained" : success ? "corrected" : "open", dueAt: toISODate(due) };
  }) };
}
