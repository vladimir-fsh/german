"use client";
import { useState } from "react";
import type { AIWritingFeedback } from "@/lib/types";
const criterionLabels = { task: "Пункты задания", coherence: "Связность", register: "Регистр", vocabulary: "Лексика", grammar: "Грамматика" };
export function WritingFeedback({ feedback }: { feedback: AIWritingFeedback }) {
  const [reference, setReference] = useState(false);
  return <section className="panel space-y-4">
    <h2 className="text-lg font-semibold">Разбор вашего текста</h2>
    <p className="text-sm">Учебная оценка: {feedback.score}/10. {feedback.levelEstimate ? `Примерный уровень только этого текста: ${feedback.levelEstimate}.` : "Для оценки уровня недостаточно данных."} Это не официальный экзаменационный балл.</p>
    {feedback.assessmentNoteRu && <p className="text-sm text-ink/65">{feedback.assessmentNoteRu}</p>}
    {feedback.rubric?.map((item) => <div key={item.criterion} className="rounded-md bg-paper p-3 text-sm"><p className="font-semibold">{criterionLabels[item.criterion]}: {item.score}/3</p><p>{item.explanationRu}</p></div>)}
    {feedback.strengths.length > 0 && <p>Получилось: {feedback.strengths.join(" ")}</p>}
    {feedback.corrections.map((item, index) => <div key={index} className="border-l-2 border-amber pl-3 text-sm"><p lang="de">{item.original}</p><p>{item.kind === "style" ? "Вариант стиля, не ошибка. " : ""}{item.explanationRu}</p>{reference && <p lang="de" className="text-moss">{item.corrected}</p>}</div>)}
    <p className="font-medium">Сначала исправьте свой текст в поле письма и отправьте на повторную проверку.</p>
    <button className="button-secondary" onClick={() => setReference(!reference)}>{reference ? "Скрыть исправленный образец" : "Показать исправленный образец"}</button>
    {reference && <p lang="de" className="whitespace-pre-wrap rounded-md bg-paper p-3">{feedback.correctedText}</p>}
    <p className="text-sm">Следующая практика: {feedback.nextPracticeRu}</p>
  </section>;
}
