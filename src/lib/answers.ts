import type { Exercise, ExerciseVerdict } from "@/lib/types";

export function normalizeAnswer(value: string, ignoreCase = false) {
  const normalized = value.normalize("NFC").trim().replace(/[.,!?;:]+$/g, "").replace(/\s+/g, " ");
  return ignoreCase ? normalized.toLocaleLowerCase("de-DE") : normalized;
}

export function checkAnswer(exercise: Exercise, answer: string): ExerciseVerdict {
  if (!answer.trim() || exercise.type === "free-writing") return "needs-review";
  const accepted = [exercise.answer, ...(exercise.acceptableAnswers ?? [])];
  if (accepted.some((item) => normalizeAnswer(item) === normalizeAnswer(answer))) return "correct";
  if (accepted.some((item) => normalizeAnswer(item, true) === normalizeAnswer(answer, true))) return "capitalization";
  // A different translation can be valid. Only an explicitly closed task has one expected answer.
  return exercise.type === "translation" ? "needs-review" : "incorrect";
}
