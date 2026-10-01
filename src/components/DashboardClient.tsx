"use client";
import Link from "next/link";
import { getCurrentLesson } from "@/lib/schedule";
import { getVocabularyCatalog, isVocabularyDue, streakStats } from "@/lib/progress";
import { skills, skillStatus, statusLabels } from "@/lib/curriculum";
import { useProgress } from "@/lib/useProgress";
import { formatRuDate, toISODate } from "@/lib/utils";
export function DashboardClient() {
  const { progress, hydrated } = useProgress();
  const lesson = getCurrentLesson(progress);
  const date = new Date(); const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const weekDays = progress.completedDates.filter((day) => day >= toISODate(monday) && day <= toISODate(sunday) && ![0, 6].includes(new Date(`${day}T12:00:00`).getDay())).length;
  const stats = streakStats(progress.completedDates);
  const due = Object.values(progress.reviewState).filter((state) => isVocabularyDue(state)).length;
  const reviewed = Object.values(progress.reviewState).filter((state) => state.lastReviewedAt && toISODate(new Date(state.lastReviewedAt)) === toISODate()).length;
  if (!hydrated) return <p>Загрузка прогресса...</p>;
  return <div className="space-y-5 pb-20"><section className="rounded-lg bg-ink p-6 text-white space-y-4"><p className="text-sm text-white/65">{formatRuDate(toISODate())} · {progress.examId === "telc-b1" ? "telc B1" : "Goethe B1"}</p><h1 className="text-2xl font-semibold">{lesson.title}</h1><p>{lesson.warmUpReview}</p><div className="flex flex-wrap gap-3"><Link className="button bg-white text-ink" href="/lesson">{progress.diagnosticCompletedAt ? "Продолжить занятие" : "Пройти начальную проверку"}</Link><Link className="button-secondary" href="/review">Повторение: {due}</Link><Link className="button-secondary" href="/skills">Навыки и черновики</Link></div></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Учебные дни этой недели", value: `${weekDays}/5`, note: "Считаются понедельник-пятница; выходные по желанию." }, { label: "Выполненные занятия", value: progress.completedLessonIds.length, note: "Разные занятия считаются отдельно, повторный клик не добавляет урок." }, { label: "Текущая серия", value: stats.currentStreak, note: `Лучшая: ${stats.bestStreak}. Выходные не обязательны.` }, { label: "Словарь", value: Object.keys(getVocabularyCatalog(progress)).length, note: `${reviewed} карточек проверено сегодня; ${due} сейчас к повторению.` }].map((metric) => <article key={metric.label} className="panel"><p className="text-sm">{metric.label}</p><p className="mt-2 text-3xl font-semibold">{metric.value}</p><p className="mt-3 text-xs text-ink/65">{metric.note}</p></article>)}</section>
    <section className="panel space-y-4"><h2 className="text-lg font-semibold">Наблюдаемые умения</h2><p className="text-sm">Показатели относятся к заданиям приложения. Полная готовность к B1 требует отдельной проверки всех экзаменационных навыков.</p><div className="grid gap-3 sm:grid-cols-2">{skills.map((skill) => <div key={skill.id} className="rounded-md bg-paper p-3"><p className="font-medium">{skill.title}</p><p className="text-sm">{statusLabels[skillStatus(progress, skill.id)]}</p></div>)}</div><p className="text-sm text-ink/65">Аудирование и оценка произношения пока не реализованы. Их результаты здесь не предполагаются.</p></section>
    <section className="panel"><h2 className="font-semibold">Ритм занятий</h2><p className="mt-3">Ориентир: {progress.studyTime}. Повторение старого, новая задача, самостоятельная попытка, исправление, проверка спустя время. Каждое пятое занятие - контрольная практика с таймером.</p><Link href="/settings" className="mt-3 inline-block text-lake">Изменить экзамен, сложность и темы</Link></section>
  </div>;
}
