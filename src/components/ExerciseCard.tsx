"use client";
import { useState } from "react";
import { checkAnswer } from "@/lib/answers";
import type { Exercise, ExerciseAttempt, ExerciseVerdict, SkillId } from "@/lib/types";
import { choice, object, string } from "@/lib/validation";

type Props = { exercise: Exercise; value: string; onChange: (value: string) => void; onAttempt: (attempt: ExerciseAttempt) => void; onHint: () => void; usedHint: boolean; attempts?: ExerciseAttempt[]; disabled?: boolean; skillId?: SkillId };
export function ExerciseCard({ exercise, value, onChange, onAttempt, onHint, usedHint, attempts = [], disabled, skillId = "writing" }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = attempts.findLast((item) => item.answer === value);
  function record(verdict: ExerciseVerdict, explanationRu: string, corrected = exercise.answer, answer = value, hinted = usedHint) {
    onAttempt({ exerciseId: exercise.id, answer, verdict, explanationRu, corrected, usedHint: hinted, skillId: exercise.skillId ?? skillId, checkedAt: new Date().toISOString() });
  }
  function check() {
    const verdict = checkAnswer(exercise, value);
    record(verdict, verdict === "capitalization" ? "Проверьте заглавные буквы: в немецком существительные пишутся с большой буквы." : verdict === "needs-review" ? "Ответ отличается от образца. Это еще не доказанная ошибка. Можно проверить смысл с AI или сравнить самостоятельно." : verdict === "correct" ? "Верно." : exercise.explanationRu);
  }
  async function checkMeaning() {
    const answer = value; const hinted = usedHint;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/ai/check-exercise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exercise, answer }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Не удалось проверить ответ.");
      const result = object(payload.result); choice(result.verdict, ["correct", "incorrect", "capitalization", "needs-review"]); string(result.explanationRu, 4000); string(result.corrected, 4000);
      record(result.verdict as ExerciseVerdict, result.explanationRu, result.corrected, answer, hinted);
    } catch (error) { setError(error instanceof Error ? error.message : "Проверка недоступна."); }
    finally { setBusy(false); }
  }
  return <article className="panel space-y-4">
    <p className="text-xs font-semibold text-lake">{{ "fill-blank": "Форма и порядок слов", translation: "Русский в немецкий", "free-writing": "Письмо", reading: "Понимание текста" }[exercise.type]}</p>
    <h3 className="font-semibold">{exercise.promptRu}</h3>
    {exercise.promptDe && <p lang="de">{exercise.promptDe}</p>}
    {exercise.sentence && exercise.sentence !== exercise.promptRu && <p lang="de">{exercise.sentence}</p>}
    {exercise.options?.length ? <label className="block">Ваш ответ<select className="field mt-2" value={value} disabled={disabled || busy} onChange={(event) => onChange(event.target.value)}><option value="">Выберите</option>{exercise.options.map((option) => <option key={option}>{option}</option>)}</select></label> : <label className="block text-sm">Ваш ответ{exercise.type === "free-writing" ? <textarea lang="de" className="field mt-2" rows={5} value={value} disabled={disabled || busy} onChange={(event) => onChange(event.target.value)} maxLength={4000} /> : <input lang="de" className="field mt-2" value={value} disabled={disabled || busy} onChange={(event) => onChange(event.target.value)} maxLength={4000} autoComplete="off" />}</label>}
    <div className="flex flex-wrap gap-2">
      <button className="button" onClick={check} disabled={disabled || busy || !value.trim()}>Проверить</button>
      {current?.verdict === "needs-review" && <button className="button-secondary" onClick={checkMeaning} disabled={disabled || busy}>{busy ? "Проверка..." : "Проверить смысл с AI"}</button>}
      {exercise.hint && <button className="button-secondary" onClick={() => { onHint(); setShowHint(!showHint); }} disabled={disabled || busy}>Подсказка</button>}
      <button className="button-secondary" onClick={() => { if (!showAnswer) onHint(); setShowAnswer(!showAnswer); }} disabled={disabled || busy || !value.trim()}>{showAnswer ? "Скрыть образец" : "Сравнить с образцом"}</button>
    </div>
    {showHint && <p>{exercise.hint}</p>}
    {current && <div role="status" className={`rounded-md p-3 text-sm ${current.verdict === "correct" ? "bg-moss/10" : "bg-amber/10"}`}><p>{current.explanationRu}</p>{current.verdict !== "correct" && <p className="mt-2">Исправьте ответ самостоятельно и проверьте снова.</p>}{current.usedHint && <p className="mt-2">Попытка с подсказкой. Навык проверим позже без образца.</p>}</div>}
    {showAnswer && <div className="rounded-md bg-paper p-3"><p lang="de">{exercise.answer}</p><p className="mt-2 text-sm">{exercise.explanationRu}</p>{exercise.acceptableAnswers?.length ? <p lang="de" className="mt-2 text-sm">Также возможно: {exercise.acceptableAnswers.join(" / ")}</p> : null}</div>}
    {error && <p role="alert" className="text-sm text-amber">{error}</p>}
  </article>;
}
