import { makePracticeLesson } from "@/lib/curriculum";
import type { Lesson, UserProgress } from "@/lib/types";
import { toISODate } from "@/lib/utils";

export function isStudyDay(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function dateFromISO(date: string) {
  return new Date(`${date}T12:00:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function nextStudyDate(from = new Date()) {
  let cursor = addDays(from, 1);
  while (!isStudyDay(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return toISODate(cursor);
}

export function previousStudyDate(dateLike: string) {
  let cursor = addDays(dateFromISO(dateLike), -1);
  while (!isStudyDay(cursor)) {
    cursor = addDays(cursor, -1);
  }
  return toISODate(cursor);
}

export function nextLessonKind(progress: UserProgress): "lesson" | "checkpoint" {
  return (new Set(progress.completedLessonIds).size + 1) % 5 === 0 ? "checkpoint" : "lesson";
}

export function getCurrentLesson(progress: UserProgress, date = new Date()): Lesson {
  const active = progress.currentGeneratedLessonId ? progress.generatedLessons[progress.currentGeneratedLessonId] : null;
  if (active && (!progress.completedLessonIds.includes(active.id) || progress.lessonResults[active.id]?.completedDate === toISODate(date))) return active;
  if (!progress.diagnosticCompletedAt) return makePracticeLesson(progress, "word-order", date, "diagnostic");
  return makePracticeLesson(progress, undefined, date, nextLessonKind(progress));
}

export function getLessonStatus(progress: UserProgress, lessonId: string, date = toISODate()) {
  if (progress.completedLessonIds.includes(lessonId)) return "completed";
  const postponedUntil = progress.postponedLessons[lessonId];
  if (postponedUntil && postponedUntil > date) return "postponed";
  return "available";
}

export function getStudyDayLabel(date = new Date()) {
  return isStudyDay(date) ? "Учебный день" : "Выходной";
}
