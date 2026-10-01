"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/components/ExerciseCard";
import { WritingFeedback } from "@/components/WritingFeedback";
import { completeLesson, emptyDraft, getVocabularyCatalog, isVocabularyDue, lessonCompletionIssues, postponeLesson, recordExerciseAttempt, recordWritingFeedback, saveGeneratedLesson, updateDraft } from "@/lib/progress";
import { getCurrentLesson, getLessonStatus, nextLessonKind, nextStudyDate } from "@/lib/schedule";
import { makePracticeLesson, nextSkill } from "@/lib/curriculum";
import { useProgress } from "@/lib/useProgress";
import { validateLesson, validateWritingFeedback } from "@/lib/validation";
import { formatRuDate, toISODate } from "@/lib/utils";

export function LessonClient() {
  const { progress, setProgress, hydrated, canEdit } = useProgress();
  const lesson = getCurrentLesson(progress);
  const draft = progress.drafts[lesson.id] ?? emptyDraft();
  const status = getLessonStatus(progress, lesson.id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const busy = generating || checking;
  const disabled = !canEdit || busy || status !== "available";
  const writingDisabled = !canEdit || busy || status === "postponed";
  const catalog = getVocabularyCatalog(progress);
  const words = lesson.vocabularyIds.map((id) => catalog[id]).filter(Boolean);
  const issues = lessonCompletionIssues(lesson, draft);
  const feedback = draft.feedback;
  useEffect(() => {
    if (canEdit && !progress.drafts[lesson.id] && !progress.completedLessonIds.includes(lesson.id)) setProgress((latest) => updateDraft(latest, lesson, (draft) => draft));
  }, [canEdit, lesson, progress.drafts, progress.completedLessonIds, setProgress]);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const remaining = lesson.timeLimitMinutes ? Math.max(0, lesson.timeLimitMinutes * 60 - Math.floor((clock - new Date(draft.startedAt).getTime()) / 1000)) : null;
  function answer(id: string, value: string) { setProgress((latest) => updateDraft(latest, lesson, (saved) => ({ ...saved, answers: { ...saved.answers, [id]: value } }))); }
  function nextLesson() {
    setMessage(""); setError("");
    setProgress((latest) => {
      const next = makePracticeLesson(latest, nextSkill(latest), new Date(), nextLessonKind(latest));
      return saveGeneratedLesson(latest, next);
    });
  }
  async function generate() {
    setGenerating(true); setError("");
    const skillId = lesson.skillId ?? nextSkill(progress);
    try {
      const response = await fetch("/api/ai/generate-lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        examId: progress.examId, targetLevel: progress.targetLevel, skillId, kind: lesson.kind === "checkpoint" ? "checkpoint" : "lesson", studyDay: progress.completedLessonIds.length + 1,
        preferredTopics: progress.preferredTopics,
        weakVocabulary: Object.values(progress.reviewState).filter((state) => state.stage !== "new" && (state.confidence <= 2 || isVocabularyDue(state))).slice(0, 12).map((state) => catalog[state.vocabularyId]?.german).filter(Boolean),
        recentLessons: progress.attempts.slice(-12).map((item) => ({ title: item.title ?? item.lessonId, skillId: item.skillId ?? "writing", result: Object.values(item.checks ?? {}).map((checks) => checks[0]?.verdict ?? "нет оценки").join(", ") })),
        recentMistakes: progress.mistakeLog.filter((item) => item.status !== "retained").slice(0, 8).map((item) => ({ skillId: item.skillId, original: item.original, corrected: item.corrected, explanationRu: item.explanationRu })),
      }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Не удалось создать урок.");
      const created = validateLesson(payload.lesson);
      setProgress((latest) => saveGeneratedLesson(latest, created));
      setMessage("Создан новый вариант. Предыдущий черновик сохранен в разделе навыков.");
    } catch (error) { setError(error instanceof Error ? error.message : "Не удалось создать урок. Текущий черновик сохранен."); }
    finally { setGenerating(false); }
  }
  async function checkWriting() {
    const text = draft.answers.freePrompt ?? "";
    setChecking(true); setError("");
    try {
      const response = await fetch("/api/ai/check-writing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, examId: lesson.examId ?? progress.examId, lessonContext: { title: lesson.title, level: lesson.level, grammarTitle: lesson.grammar.title, freePromptRu: lesson.freePromptRu, successCriteria: lesson.successCriteria ?? [] }, answer: text }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Проверка недоступна.");
      const result = validateWritingFeedback(payload.feedback);
      setProgress((latest) => recordWritingFeedback(latest, lesson.id, result, new Date(), text));
    } catch (error) { setError(error instanceof Error ? error.message : "Проверка недоступна."); }
    finally { setChecking(false); }
  }
  if (!hydrated) return <p>Загрузка сохраненного занятия...</p>;
  return <div className="space-y-5 pb-20">
    <section className="panel space-y-3">
      <p className="text-sm text-lake">{lesson.kind === "diagnostic" ? "Начальная проверка" : lesson.kind === "checkpoint" ? "Контрольная практика" : "Занятие"} · {lesson.level} · {lesson.examId === "telc-b1" ? "telc B1" : "Goethe B1"}</p>
      <h1 className="text-2xl font-semibold">{lesson.title}</h1><p>{lesson.warmUpReview}</p>
      <p className="text-sm text-ink/60">Около {lesson.estimatedMinutes} минут. {status === "completed" ? "Выполнено; освоение учитывается отдельно." : status === "postponed" ? `Перенесено на ${formatRuDate(progress.postponedLessons[lesson.id])}.` : "Ответы сохраняются автоматически."}</p>
      {remaining !== null && <p role="timer">Учебный таймер: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}. {remaining === 0 && "Время истекло. Можно закончить работу; результат сохранится с фактической длительностью."} Это не полный пробный экзамен.</p>}
      {status === "postponed" && <button className="button-secondary" disabled={!canEdit} onClick={() => setProgress((latest) => postponeLesson(latest, lesson.id, toISODate()))}>Продолжить сегодня</button>}
      {status === "completed" && <button className="button" onClick={nextLesson} disabled={!canEdit || busy}>Следующее занятие</button>}
      {message && <p role="status" className="text-moss">{message}</p>}
    </section>
    {lesson.kind !== "diagnostic" && status === "available" && <section className="panel space-y-3"><p>Цель занятия выбрана по результатам навыков и ошибкам. Можно получить новый вариант заданий под эту цель.</p><button className="button-secondary" disabled={!canEdit || busy} onClick={generate}>{generating ? "Создание..." : "Новый вариант с AI"}</button><p className="text-xs text-ink/60">Без AI доступны встроенные упражнения и учебные письма.</p></section>}
    {error && <p role="alert" className="rounded-md bg-amber/10 p-4">{error}</p>}
    {lesson.kind !== "diagnostic" && <>
      <section className="panel"><h2 className="text-lg font-semibold">Слова и конструкции</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{words.map((word) => <div key={word.id}><p lang="de" className="font-semibold">{word.german}{word.plural ? `, ${word.plural}` : ""}</p><p>{word.russian}</p>{word.verbForms && <p lang="de">{word.verbForms}</p>}{word.construction && <p lang="de">{word.construction}</p>}<p lang="de" className="mt-1 text-sm text-ink/65">{word.exampleSentence}</p></div>)}</div><p className="mt-4 text-sm">После завершения новые слова поступят в повторение с учетом лимита 5 в день. Остальные останутся в словаре.</p></section>
      <section className="panel"><h2 className="text-lg font-semibold">{lesson.grammar.title}</h2><p className="mt-3">{lesson.grammar.explanationRu}</p>{lesson.grammar.examples.map((item, index) => <p key={index} lang="de" className="mt-2 rounded-md bg-paper p-3">{item}</p>)}</section>
    </>}
    {lesson.readingText && <section className="panel"><h2 className="text-lg font-semibold">Lesen</h2><p lang="de" className="mt-3 whitespace-pre-wrap leading-7">{lesson.readingText}</p></section>}
    <p className="text-sm text-ink/65">Первая попытка без подсказки сохраняется отдельно. Ошибки не мешают завершить занятие, но назначаются на практику.</p>
    {lesson.exercises.map((exercise) => <ExerciseCard key={`${lesson.id}-${exercise.id}`} exercise={exercise} value={draft.answers[exercise.id] ?? ""} onChange={(value) => answer(exercise.id, value)} attempts={draft.checks[exercise.id]} usedHint={draft.revealedIds.includes(exercise.id)} disabled={disabled} skillId={lesson.skillId} onHint={() => setProgress((latest) => updateDraft(latest, lesson, (saved) => ({ ...saved, revealedIds: [...new Set([...saved.revealedIds, exercise.id])] })))} onAttempt={(attempt) => setProgress((latest) => recordExerciseAttempt(latest, lesson, attempt))} />)}
    <section className="panel space-y-4"><h2 className="text-lg font-semibold">Письмо</h2><p>{lesson.freePromptRu}</p>{lesson.successCriteria && <ul className="list-disc space-y-1 pl-5 text-sm">{lesson.successCriteria.map((item) => <li key={item}>{item}</li>)}</ul>}
      <label className="block">Ваш текст<textarea lang="de" className="field mt-2" value={draft.answers.freePrompt ?? ""} onChange={(event) => answer("freePrompt", event.target.value)} rows={8} maxLength={12000} disabled={writingDisabled} /></label>
      <p className="text-sm">{(draft.answers.freePrompt ?? "").trim().split(/\s+/).filter(Boolean).length} слов. Для учебного завершения нужно хотя бы 20; объем экзаменационного задания определяется его инструкцией.</p>
      <button className="button" onClick={checkWriting} disabled={writingDisabled || (draft.answers.freePrompt ?? "").trim().length < 12}>{checking ? "Проверка..." : feedback ? "Проверить исправленный текст" : "Разобрать письмо с AI"}</button>
      <p className="text-xs text-ink/60">Текст отправляется в OpenAI. API-ключ хранится на сервере. Без AI письмо сохранится как попытка без оценки.</p>
      {feedback && draft.feedbackAnswer !== draft.answers.freePrompt && <p role="status">Текст изменен. Предыдущий разбор относится к прошлой версии; отправьте исправление на проверку.</p>}
      {draft.writingHistory && draft.writingHistory.length > 1 && <details><summary>Предыдущие версии письма ({draft.writingHistory.length - 1})</summary>{draft.writingHistory.slice(0, -1).map((item, index) => <p key={index} lang="de" className="mt-3 whitespace-pre-wrap rounded-md bg-paper p-3">{item.answer}</p>)}</details>}
    </section>
    {feedback && <WritingFeedback key={`${lesson.id}-${draft.writingHistory?.length}`} feedback={feedback} />}
    {status !== "completed" && <section className="panel space-y-4"><h2 className="font-semibold">Сохранить результат занятия</h2><p className="text-sm">Завершение означает выполненную работу. Навыки подтверждаются отдельными попытками без подсказок и повторной проверкой спустя время.</p>{issues.length > 0 && <ul className="list-disc pl-5 text-sm">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}<div className="flex flex-wrap gap-3"><button className="button" disabled={disabled || issues.length > 0} onClick={() => { try { setProgress((latest) => completeLesson(latest, lesson)); setMessage("Занятие сохранено. Новые слова и ошибки назначены на повторение."); } catch (error) { setError(error instanceof Error ? error.message : "Не удалось завершить занятие."); } }}>Завершить занятие</button><button className="button-secondary" disabled={disabled} onClick={() => { const until = nextStudyDate(); setProgress((latest) => postponeLesson(latest, lesson.id, until)); }}>Перенести</button></div></section>}
    <div className="flex gap-5"><Link className="text-lake" href="/review">Повторить слова и ошибки</Link><Link className="text-lake" href="/skills">Навыки и черновики</Link></div>
  </div>;
}
