"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/lib/useProgress";
import { recordWritingFeedback } from "@/lib/progress";
import { recognitionText, type SpeechResults } from "@/lib/speech";
import { validateSpeakingFeedback } from "@/lib/validation";
type Recognition = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: { results: SpeechResults }) => void) | null; onerror: ((event: { error?: string }) => void) | null; onend: (() => void) | null };
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
const prompts = [
  { title: "Мнение", question: "Brauchen Kinder ein eigenes Handy?", hint: "Приведите личный пример, плюсы и минусы, затем объясните мнение." },
  { title: "Учеба", question: "Wie bereiten Sie sich auf die B1-Prüfung vor?", hint: "Расскажите, как часто и что именно вы практикуете." },
  { title: "Работа", question: "Welche Rolle spielt Deutsch in Ihrem Beruf?", hint: "Приведите две рабочие ситуации." },
  { title: "Совместный план", question: "Wir möchten am Samstag zusammen Deutsch üben. Wo und wann treffen wir uns?", hint: "Предложите время и место, объясните выбор и задайте встречный вопрос." },
];
export function SpeakingClient() {
  const { progress, setProgress, hydrated, canEdit } = useProgress();
  const practice = progress.speakingPractice;
  const prompt = prompts[practice.promptIndex]; const question = practice.followUpQuestion ?? prompt.question;
  const latest = practice.history.at(-1);
  const feedback = latest?.promptDe === question && latest.transcript === practice.transcript ? latest.feedback : null;
  const [busy, setBusy] = useState(false); const [listening, setListening] = useState(false); const [interim, setInterim] = useState(""); const [error, setError] = useState(""); const [showReference, setShowReference] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  function stop() { const current = recognition.current; if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.stop(); } setListening(false); setInterim(""); }
  useEffect(() => {
    const speechWindow = window as SpeechWindow; const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (Constructor) { const instance = new Constructor(); instance.lang = "de-DE"; instance.interimResults = true; instance.continuous = true; recognition.current = instance; }
    return () => { const current = recognition.current; if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.stop(); } window.speechSynthesis?.cancel(); recognition.current = null; };
  }, []);
  function speak() {
    if (!window.speechSynthesis) { setError("Озвучивание недоступно в этом браузере."); return; }
    const utterance = new SpeechSynthesisUtterance(question); utterance.lang = "de-DE"; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  }
  function record() {
    const current = recognition.current; if (!current) { setError("Распознавание недоступно. Введите ответ текстом."); return; }
    const base = practice.transcript; setError("");
    current.onresult = (event) => { const text = recognitionText(base, event.results); setProgress((saved) => ({ ...saved, speakingPractice: { ...saved.speakingPractice, transcript: text.transcript.slice(0, 12000) } })); setInterim(text.interim); };
    current.onerror = (event) => { setError(`Ошибка распознавания: ${event.error ?? "unknown"}`); setListening(false); setInterim(""); };
    current.onend = () => { setListening(false); setInterim(""); };
    try { current.start(); setListening(true); } catch { setError("Не удалось начать распознавание. Попробуйте снова."); }
  }
  async function check() {
    setBusy(true); setError(""); setShowReference(false);
    const answer = practice.transcript;
    try {
      const response = await fetch("/api/ai/check-speaking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promptDe: question, transcript: answer, conversation: practice.history.slice(-6).map((turn) => ({ question: turn.promptDe, answer: turn.transcript })) }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Проверка недоступна.");
      const result = validateSpeakingFeedback(payload.feedback);
      setProgress((saved) => {
        const next = recordWritingFeedback(saved, `dialogue-${practice.promptIndex}`, { correctedText: result.correctedTranscript, levelEstimate: null, score: result.score, strengths: result.strengths, corrections: result.corrections, grammarTipsRu: result.speakingTipsRu, nextPracticeRu: result.nextPracticeRu }, new Date(), undefined, "speaking");
        return { ...next, speakingPractice: { ...next.speakingPractice, history: [...next.speakingPractice.history, { promptDe: question, transcript: answer, feedback: result, checkedAt: new Date().toISOString() }].slice(-100) } };
      });
    } catch (error) { setError(error instanceof Error ? error.message : "Проверка недоступна."); }
    finally { setBusy(false); }
  }
  if (!hydrated) return <p>Загрузка диалога...</p>;
  return <div className="space-y-5 pb-20"><section className="panel space-y-3"><h1 className="text-2xl font-semibold">Диалог на немецком</h1><p>Ответьте текстом, разберите формулировку и продолжите разговор. Ответы сохраняются автоматически.</p><p className="text-sm text-ink/65">Здесь оцениваются содержание, лексика и грамматика текста. Произношение, темп и паузы не оцениваются.</p></section><section className="panel space-y-4"><p className="text-sm text-lake">{prompt.title}</p><h2 lang="de" className="text-xl font-semibold">{question}</h2><p>{prompt.hint}</p><label className="block">Ваш ответ<textarea className="field mt-2" lang="de" rows={7} maxLength={12000} value={practice.transcript} disabled={!canEdit || busy || listening} onChange={(event) => { const value = event.target.value; setProgress((saved) => ({ ...saved, speakingPractice: { ...saved.speakingPractice, transcript: value } })); }} /></label>{interim && <p lang="de">{interim}</p>}<div className="flex flex-wrap gap-3"><button className="button" onClick={check} disabled={!canEdit || busy || listening || practice.transcript.trim().length < 10}>{busy ? "Проверка..." : "Разобрать ответ"}</button><button className="button-secondary" disabled={!canEdit || busy} onClick={() => { stop(); setProgress((saved) => ({ ...saved, speakingPractice: { ...saved.speakingPractice, promptIndex: (saved.speakingPractice.promptIndex + 1) % prompts.length, transcript: "", followUpQuestion: null } })); }}>Другая тема</button></div><details><summary>Браузерный голосовой ввод</summary><p className="my-3 text-sm">Распознавание зависит от браузера и может передавать аудио его сервису. В OpenAI отправляется только текст. Это не проверка произношения.</p><div className="flex gap-3"><button className="button-secondary" disabled={!canEdit || busy || listening} onClick={speak}>Озвучить вопрос</button><button className="button-secondary" disabled={!canEdit || busy} onClick={listening ? stop : record}>{listening ? "Остановить" : "Ввести голосом"}</button></div></details></section>{error && <p role="alert" className="rounded-md bg-amber/10 p-3">{error}</p>}{feedback && <section className="panel space-y-4"><h2 className="font-semibold">Разбор текста</h2><p className="text-sm">Учебная оценка текста: {feedback.score}/10. Это не экзаменационный балл и не оценка общего уровня.</p>{feedback.strengths.map((item, index) => <p key={index}>{item}</p>)}{feedback.corrections.map((item, index) => <div key={index}><p lang="de">{item.original}</p><p className="text-sm">{item.explanationRu}</p></div>)}<p>Исправьте свой ответ самостоятельно и проверьте снова.</p><button className="button-secondary" onClick={() => setShowReference(!showReference)}>{showReference ? "Скрыть образец" : "Показать исправленный образец"}</button>{showReference && <p lang="de">{feedback.correctedTranscript}</p>}<p lang="de">{feedback.followUpQuestionDe}</p><button className="button" disabled={!canEdit || busy || listening} onClick={() => setProgress((saved) => ({ ...saved, speakingPractice: { ...saved.speakingPractice, followUpQuestion: feedback.followUpQuestionDe, transcript: "" } }))}>Ответить на следующий вопрос</button></section>}<section className="panel space-y-3"><h2 className="font-semibold">История диалога</h2>{practice.history.slice(-10).reverse().map((turn, index) => <details key={index}><summary lang="de">{turn.promptDe}</summary><p lang="de" className="mt-2 whitespace-pre-wrap">{turn.transcript}</p></details>)}{practice.history.length === 0 && <p>Проверенных ответов пока нет.</p>}</section></div>;
}
