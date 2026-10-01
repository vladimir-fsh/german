"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, FileText, Landmark } from "lucide-react";
import { examProfiles, weeklyExamPlan } from "@/lib/exam";
import { useProgress } from "@/lib/useProgress";

export function ExamClient() {
  const { progress, setProgress, canEdit } = useProgress();
  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <section className="rounded-lg bg-ink p-5 text-white shadow-soft sm:p-6">
        <p className="text-sm font-medium text-white/65">Цель подготовки</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          Готовимся под реальные темы B1
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
          Выберите Goethe или telc. Приложение тренирует чтение, письмо и языковые конструкции.
          Полный экзамен также требует аудирования и устного взаимодействия; эти навыки пока
          не измеряются. Einbürgerungstest остается отдельным справочным блоком.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lake/10 text-lake">
              <BadgeCheck size={20} aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">B1 Nachweis</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Основной трек готовит к языковому B1: Alltag, Arbeit, Wohnen, Gesundheit, Familie,
            Freizeit, Reisen, Medien, Umwelt и Termine.
          </p>
        </article>
        <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/15 text-amber">
              <Landmark size={20} aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">Einbürgerungstest</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Это отдельный тест по демократии, истории, обществу и федеральной земле. Его не нужно
            смешивать с B1-лексикой и уроками говорения/письма.
          </p>
        </article>
        <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss/10 text-moss">
              <Clock size={20} aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">Тайминг</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Каждое пятое занятие предлагает контрольную практику с таймером. Это учебная
            проверка отдельных задач, не полный пробный экзамен. Официальные образцы доступны
            по ссылкам ниже.
          </p>
        </article>
      </section>

      <section className="space-y-4">
        {examProfiles.map((profile) => (
          <article key={profile.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-lake">{profile.subtitle}</p>
                <h2 className="mt-1 text-xl font-semibold">{profile.title}</h2>
                {profile.id !== "citizenship" && <button className="button-secondary mt-3" disabled={!canEdit || progress.examId === profile.id} onClick={() => setProgress((latest) => ({ ...latest, examId: profile.id as "goethe-b1" | "telc-b1" }))}>{progress.examId === profile.id ? "Выбран для новых занятий" : "Выбрать экзамен"}</button>}
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">{profile.descriptionRu}</p>
              </div>
              <FileText className="hidden text-ink/20 sm:block" size={28} aria-hidden />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {profile.sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-ink/10 bg-paper p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="mt-1 text-sm text-ink/55">{section.duration}</p>
                    </div>
                    {section.id.includes("hoeren") ? <span className="text-xs text-ink/60">Пока не реализовано</span> : <Link
                      href={section.practiceRoute}
                      className="inline-flex min-h-9 items-center justify-center gap-1 rounded-md bg-white px-2.5 text-xs font-semibold text-lake"
                    >
                      {section.practiceLabel}
                      <ArrowRight size={14} aria-hidden />
                    </Link>}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/70">{section.formatRu}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {section.focus.map((item) => (
                      <span key={item} className="rounded-md bg-white px-2 py-1 text-xs text-ink/60">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="panel space-y-3">
        <h2 className="font-semibold">Официальные образцы заданий</h2>
        <p><a className="text-lake" href="https://www.goethe.de/ins/de/de/prf/prf/gzb1/ueb.html" target="_blank" rel="noreferrer">Goethe B1: задания и материалы</a></p>
        <p><a className="text-lake" href="https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/" target="_blank" rel="noreferrer">telc Deutsch B1: формат и пробный экзамен</a></p>
      </section>
      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold">Недельная схема подготовки</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {weeklyExamPlan.map((item) => (
            <p key={item} className="rounded-md bg-paper p-3 text-sm leading-6 text-ink/70">
              {item}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
