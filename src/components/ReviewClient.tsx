"use client";
import { useState } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/components/ExerciseCard";
import { normalizeAnswer } from "@/lib/answers";
import { skillExercises, skills } from "@/lib/curriculum";
import { getVocabularyCatalog, introduceVocabulary, isVocabularyDue, markVocabularyKnowledge, MAX_NEW_WORDS_PER_DAY, recordMistakePractice } from "@/lib/progress";
import type { Exercise, ExerciseAttempt, MistakeLogItem, MistakePracticeDraft, ReviewState, VocabularyItem } from "@/lib/types";
import { useProgress } from "@/lib/useProgress";
import { toISODate } from "@/lib/utils";

function WordReview({ word, state, disabled, onReview }: { word: VocabularyItem; state: ReviewState; disabled: boolean; onReview: (knows: boolean) => void }) {
  const [answer, setAnswer] = useState(""); const [revealed, setRevealed] = useState(false);
  const produce = state.direction === "produce";
  const expected = produce ? word.german : word.russian;
  const matches = normalizeAnswer(answer) === normalizeAnswer(expected);
  return <section className="panel space-y-4"><p className="text-sm text-lake">{produce ? "Вспомните по-немецки, с артиклем" : "Объясните значение по-русски"} · {state.stage === "learning" ? "Первичное обучение" : "Повторение"}</p><h2 className="text-2xl font-semibold" lang={produce ? "ru" : "de"}>{produce ? word.russian : word.german}</h2><label className="block">Ответ без подсказки<input className="field mt-2" lang={produce ? "de" : "ru"} value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={disabled || revealed} autoComplete="off" maxLength={500} /></label><button className="button-secondary" disabled={disabled || !answer.trim() || revealed} onClick={() => setRevealed(true)}>Сравнить ответ</button>{revealed && <><div className="rounded-md bg-paper p-3"><p lang={produce ? "de" : "ru"} className="font-semibold">{expected}</p>{word.plural && <p lang="de">{word.plural}</p>}{word.verbForms && <p lang="de">{word.verbForms}</p>}{word.construction && <p lang="de">{word.construction}</p>}<p lang="de">{word.exampleSentence}</p><p className="mt-2 text-sm">{matches ? "Ответ совпал." : "Сравните смысл и форму. Для немецкого проверьте также артикль и заглавную букву. Для русского возможны синонимы."}</p></div><div className="flex flex-wrap gap-2"><button className="button-secondary" disabled={disabled} onClick={() => onReview(false)}>Не вспомнил / ошибся</button><button className="button" disabled={disabled} onClick={() => onReview(true)}>Вспомнил самостоятельно</button></div></>}</section>;
}
function MistakePractice({ mistake, draft, disabled, onDraft, onResult }: { mistake: MistakeLogItem; draft?: MistakePracticeDraft; disabled: boolean; onDraft: (draft: MistakePracticeDraft) => void; onResult: (success: boolean) => void }) {
  const transfer = mistake.successfulDates.length > 0;
  const exercises = skillExercises[mistake.skillId];
  const variant = exercises[(new Date().getDate() + mistake.successfulDates.length) % exercises.length];
  const exercise: Exercise = transfer ? { ...variant, id: `transfer-${mistake.id}-${variant.id}-${mistake.successfulDates.length}` } : { id: `repair-${mistake.id}`, skillId: mistake.skillId, type: mistake.source === "exercise" ? "fill-blank" : "translation", promptRu: `Исправьте самостоятельно: ${mistake.original || "пустой ответ"}. ${mistake.explanationRu}`, answer: mistake.corrected, explanationRu: mistake.explanationRu, hint: "Сначала вспомните правило. Если трудно, сравните с образцом и повторите позже без него." };
  const saved: MistakePracticeDraft = draft?.exerciseId === exercise.id ? draft : { exerciseId: exercise.id, answer: "", usedHint: false, attempts: [], updatedAt: new Date().toISOString() };
  const { answer, usedHint: hinted, attempts } = saved;
  function change(update: Partial<MistakePracticeDraft>) { onDraft({ ...saved, ...update, updatedAt: new Date().toISOString() }); }
  function record(attempt: ExerciseAttempt) { change({ attempts: attempts.length >= 100 ? [attempts[0], ...attempts.slice(-98), attempt] : [...attempts, attempt] }); if (attempt.verdict === "correct" && !attempt.usedHint) onResult(!transfer || !attempts.some((item) => ["incorrect", "capitalization"].includes(item.verdict))); }
  return <div className="space-y-2"><p className="text-sm font-medium">{skills.find((skill) => skill.id === mistake.skillId)?.title}: {transfer ? "новая ситуация спустя время" : "самостоятельное исправление"}</p><ExerciseCard exercise={exercise} value={answer} onChange={(answer) => change({ answer })} usedHint={hinted} onHint={() => change({ usedHint: true })} attempts={attempts} onAttempt={record} disabled={disabled} />{hinted && <button className="button-secondary" disabled={disabled} onClick={() => onResult(false)}>Повторить без подсказки завтра</button>}</div>;
}
export function ReviewClient() {
  const { progress, setProgress, hydrated, canEdit } = useProgress();
  const [message, setMessage] = useState("");
  const catalog = getVocabularyCatalog(progress);
  const due = Object.values(progress.reviewState).filter((state) => isVocabularyDue(state)).sort((a, b) => (a.stage === "learning" ? 0 : 1) - (b.stage === "learning" ? 0 : 1) || a.dueAt.localeCompare(b.dueAt));
  const fresh = Object.values(progress.reviewState).filter((state) => state.stage === "new");
  const introducedToday = Object.values(progress.reviewState).filter((state) => state.introducedAt && toISODate(new Date(state.introducedAt)) === toISODate()).length;
  const mistakes = progress.mistakeLog.filter((item) => item.status !== "retained" && item.dueAt <= toISODate());
  const upcoming = Object.values(progress.reviewState).filter((state) => state.stage === "learning" && !isVocabularyDue(state)).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  if (!hydrated) return <p>Загрузка повторения...</p>;
  return <div className="space-y-5 pb-20"><section className="panel space-y-3"><h1 className="text-2xl font-semibold">Повторение слов и ошибок</h1><p>{due.length} карточек и {mistakes.length} ошибок к практике. Новых слов сегодня: {introducedToday}/{MAX_NEW_WORDS_PER_DAY}.</p><p className="text-sm">Сначала воспроизведите ответ, затем сравните. Забытое вернется через минуту, первая успешная попытка - через 10 минут. После двух успехов - через день; дальше интервал постепенно растет. Это выбранная учебная политика, не универсальный оптимальный график.</p>{message && <p role="status">{message}</p>}</section>
    {due[0] && catalog[due[0].vocabularyId] ? <WordReview key={`${due[0].vocabularyId}-${due[0].lastReviewedAt}-${due[0].direction}`} word={catalog[due[0].vocabularyId]} state={due[0]} disabled={!canEdit} onReview={(knows) => setProgress((latest) => markVocabularyKnowledge(latest, due[0].vocabularyId, knows))} /> : <section className="panel"><p>Сейчас нет карточек к повторению.</p>{upcoming && <p className="mt-2">Следующий короткий повтор: {new Date(upcoming.dueAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}. Очередь обновляется автоматически.</p>}</section>}
    {fresh.length > 0 && <section className="panel space-y-3"><p>{fresh.length} слов еще не введено в обучение.</p><button className="button-secondary" disabled={!canEdit || due.length > 10 || introducedToday >= MAX_NEW_WORDS_PER_DAY} onClick={() => { setProgress((latest) => introduceVocabulary(latest, fresh.map((state) => state.vocabularyId))); setMessage("Новые слова добавлены в сегодняшнюю практику."); }}>Начать новые слова (до {MAX_NEW_WORDS_PER_DAY - introducedToday})</button>{due.length > 10 && <p className="text-sm">Сначала сократите очередь повторения до 10 карточек.</p>}</section>}
    {mistakes.length > 0 && <section className="space-y-4"><h2 className="text-xl font-semibold">Работа над ошибками</h2>{mistakes.slice(0, 5).map((mistake) => <MistakePractice key={`${mistake.id}-${mistake.successfulDates.length}`} mistake={mistake} draft={progress.mistakePracticeDrafts[mistake.id]} disabled={!canEdit} onDraft={(draft) => setProgress((latest) => ({ ...latest, mistakePracticeDrafts: { ...latest.mistakePracticeDrafts, [mistake.id]: draft } }))} onResult={(success) => { setProgress((latest) => recordMistakePractice(latest, mistake.id, success)); setMessage(success ? "Самостоятельная попытка сохранена. Новая ситуация будет назначена через 3 дня." : "Назначено повторение завтра без подсказки."); }} />)}{mistakes.length > 5 && <p>После этих заданий появятся следующие ошибки.</p>}</section>}
    <Link className="text-lake" href="/lesson">Продолжить занятие</Link>
  </div>;
}
