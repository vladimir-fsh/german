import type { Exercise, Lesson, SkillId, UserProgress, VocabularyTopic } from "@/lib/types";
import { vocabulary } from "@/lib/seed";
import { toISODate } from "@/lib/utils";

export const skills: Array<{ id: SkillId; title: string; goal: string; prerequisites: SkillId[] }> = [
  { id: "word-order", title: "Порядок слов", goal: "Построить предложение и вопрос", prerequisites: [] },
  { id: "cases", title: "Артикли и падежи", goal: "Употребить существительное в нужной форме", prerequisites: [] },
  { id: "past", title: "Рассказ об опыте", goal: "Рассказать, что произошло", prerequisites: ["word-order"] },
  { id: "reasons", title: "Объяснение причины", goal: "Объяснить решение с weil и dass", prerequisites: ["word-order"] },
  { id: "requests", title: "Вежливая просьба", goal: "Попросить помощь или перенести запись", prerequisites: ["cases"] },
  { id: "opinions", title: "Мнение и аргументы", goal: "Выразить мнение и привести пример", prerequisites: ["reasons"] },
  { id: "planning", title: "Согласование плана", goal: "Предложить вариант и договориться", prerequisites: ["requests"] },
  { id: "reading", title: "Понимание текста", goal: "Найти главную мысль и конкретные детали", prerequisites: [] },
  { id: "writing", title: "Связное письмо", goal: "Выполнить все пункты письма в нужном регистре", prerequisites: ["requests", "reasons"] },
];

const make = (id: string, skillId: SkillId, promptRu: string, answer: string, explanationRu: string, type: Exercise["type"] = "fill-blank", acceptableAnswers: string[] = []): Exercise => ({ id, skillId, type, promptRu, answer, explanationRu, acceptableAnswers });
export const skillExercises: Record<SkillId, Exercise[]> = {
  "word-order": [make("order-1", "word-order", "Вставьте глагол: Morgen ___ ich zum Arzt. (gehen)", "gehe", "После Morgen спрягаемый глагол занимает вторую позицию."), make("order-2", "word-order", "Вставьте глагол: Wann ___ der Kurs? (beginnen)", "beginnt", "После вопросительного слова стоит спрягаемый глагол."), make("order-3", "word-order", "Вставьте глагол: Am Wochenende ___ wir Freunde. (besuchen)", "besuchen", "Подлежащее wir требует формы besuchen.")],
  cases: [make("cases-1", "cases", "Ich habe ___ Termin. (ein)", "einen", "der Termin: после haben нужен Akkusativ."), make("cases-2", "cases", "Ich fahre mit ___ Bus. (der)", "dem", "mit требует Dativ."), make("cases-3", "cases", "Ich helfe ___ Nachbarin. (die)", "der", "helfen требует Dativ: der Nachbarin.")],
  past: [make("past-1", "past", "Вставьте вспомогательный глагол: Ich ___ gestern nach Berlin gefahren.", "bin", "Движение с fahren: sein + Partizip II."), make("past-2", "past", "Вставьте Partizip II: Wir haben gestern Deutsch ___. (lernen)", "gelernt", "lernen → gelernt, вспомогательный глагол haben."), make("past-3", "past", "Вставьте Partizip II: Sie hat eine E-Mail ___. (schreiben)", "geschrieben", "schreiben → geschrieben.")],
  reasons: [make("reason-1", "reasons", "Ich bleibe zu Hause, ___ ich krank bin. Вставьте союз причины.", "weil", "После weil спрягаемый глагол стоит в конце."), make("reason-2", "reasons", "Вставьте глагол: Ich denke, dass der Kurs hilfreich ___. (sein)", "ist", "После dass глагол стоит в конце."), make("reason-3", "reasons", "Вставьте модальный глагол: Ich komme später, weil ich arbeiten ___. (müssen)", "muss", "В придаточном модальный глагол стоит после инфинитива.")],
  requests: [make("request-1", "requests", "Вежливая просьба: ___ Sie mir bitte helfen? (können, Konjunktiv II)", "Könnten", "Könnten Sie ...? - вежливая просьба."), make("request-2", "requests", "Ich würde den Termin gern ___. (перенести)", "verschieben", "würde + Infinitiv в конце."), make("request-3", "requests", "Переведите: Я хотел бы перенести встречу.", "Ich möchte den Termin verschieben.", "Допускаются разные естественные вежливые формулировки.", "translation", ["Ich möchte gern den Termin verschieben.", "Ich würde den Termin gern verschieben.", "Ich würde gerne den Termin verschieben."])],
  opinions: [make("opinion-1", "opinions", "Meiner ___ nach ist das sinnvoll. (мнение)", "Meinung", "Meiner Meinung nach ... - конструкция для выражения мнения."), make("opinion-2", "opinions", "Переведите: Я считаю, что немецкий важен.", "Ich finde, dass Deutsch wichtig ist.", "После dass глагол стоит в конце.", "translation", ["Ich denke, dass Deutsch wichtig ist.", "Meiner Meinung nach ist Deutsch wichtig."]), make("opinion-3", "opinions", "Das ist praktisch, ___ man Zeit spart. Вставьте союз причины.", "weil", "Добавляйте причину к своему мнению.")],
  planning: [make("plan-1", "planning", "Переведите: Давай встретимся в субботу.", "Treffen wir uns am Samstag.", "Можно предложить встречу разными способами.", "translation", ["Lass uns uns am Samstag treffen.", "Lass uns am Samstag zusammenkommen.", "Wir könnten uns am Samstag treffen."]), make("plan-2", "planning", "Wir könnten uns um 15 Uhr ___. (treffen)", "treffen", "könnten + Infinitiv выражает предложение."), make("plan-3", "planning", "Вставьте вопросительное слово: ___ passt es dir besser, Samstag oder Sonntag?", "Wann", "Wann спрашивает о времени.")],
  reading: [make("read-1", "reading", "Die Anmeldung ist bis Freitag möglich. Когда заканчивается запись? Ответьте по-немецки одним словом.", "Freitag", "bis Freitag указывает последний день записи.", "reading", ["Am Freitag"]), make("read-2", "reading", "Der Kurs beginnt um 18 Uhr und dauert zwei Stunden. Во сколько он заканчивается?", "20 Uhr", "18 + 2 = 20 Uhr.", "reading", ["Um 20 Uhr", "20:00", "20"]), make("read-3", "reading", "Wegen Bauarbeiten fährt der Bus heute nicht. Почему не ходит автобус? Скопируйте слово из текста.", "Bauarbeiten", "Wegen Bauarbeiten означает из-за строительных работ.", "reading")],
  writing: [make("write-1", "writing", "Вы пишете незнакомому адресату. Вставьте слово: Sehr ___ Damen und Herren,", "geehrte", "Для формального письма подходит Sehr geehrte Damen und Herren."), make("write-2", "writing", "Формальное завершение: Mit freundlichen ___", "Grüßen", "Стандартная формула завершения письма."), make("write-3", "writing", "Вставьте союз: Ich kann nicht kommen, ___ ich krank bin.", "weil", "Укажите причину и затем предложите решение.")],
};

const grammarContent: Record<SkillId, { explanationRu: string; examples: string[] }> = {
  "word-order": { explanationRu: "В утверждении спрягаемый глагол занимает вторую позицию. Первую позицию может занимать время или место. В вопросе с вопросительным словом глагол стоит сразу после него.", examples: ["Heute kauft Maria Brot.", "Wo arbeitet dein Bruder?"] },
  cases: { explanationRu: "Форма артикля зависит от рода, числа и падежа. Прямое дополнение часто стоит в Akkusativ. После mit и глагола helfen нужен Dativ.", examples: ["Ich sehe einen Hund.", "Sie spricht mit einer Kollegin."] },
  past: { explanationRu: "Perfekt образуется с haben или sein и Partizip II в конце. Глаголы направленного движения часто используют sein. Форму Partizip II неправильных глаголов нужно запоминать.", examples: ["Wir haben einen Film gesehen.", "Er ist nach Hause gegangen."] },
  reasons: { explanationRu: "После weil и dass спрягаемый глагол стоит в конце придаточного. Weil вводит причину, dass - содержание мысли или сообщения.", examples: ["Sie fährt mit dem Zug, weil ihr Auto kaputt ist.", "Er sagt, dass er morgen Zeit hat."] },
  requests: { explanationRu: "Для вежливой просьбы подходят könnten и würde + Infinitiv. Назовите просьбу, коротко объясните причину и предложите решение.", examples: ["Könnten Sie das Fenster öffnen?", "Ich würde gern einen Tisch reservieren."] },
  opinions: { explanationRu: "Выразите мнение, объясните причину и приведите конкретный пример. Связки meiner Meinung nach, außerdem и zum Beispiel помогают построить связный ответ.", examples: ["Meiner Meinung nach ist Sport wichtig.", "Zum Beispiel gehe ich jeden Abend spazieren."] },
  planning: { explanationRu: "Предложите вариант с könnten, уточните предпочтение партнера, отреагируйте на ответ и подтвердите договоренность.", examples: ["Wir könnten gemeinsam kochen.", "Passt dir Freitag? - Ja, das passt gut."] },
  reading: { explanationRu: "Сначала определите, кто пишет и зачем. Затем найдите даты, время, условия и требуемое действие. Опирайтесь на текст, а не на догадку.", examples: ["Bitte bringen Sie Ihren Ausweis mit.", "Die Veranstaltung fällt heute aus."] },
  writing: { explanationRu: "Выполните каждый пункт задания. Выберите обращение и завершение по адресату. Разделите письмо на короткие связанные абзацы; в конце проверьте глаголы и существительные.", examples: ["Sehr geehrte Frau Müller, ...", "Liebe Anna, vielen Dank für deine Nachricht."] },
};
const topicForSkill: Record<SkillId, VocabularyTopic> = { "word-order": "Alltag", cases: "Wohnen", past: "Freizeit", reasons: "Gesundheit", requests: "Termine", opinions: "Freizeit", planning: "Freizeit", reading: "Termine", writing: "Termine" };
const writingGoals: Record<SkillId, string> = {
  "word-order": "Расскажите знакомому о своем обычном дне: утро, работа или учеба, вечер и предложите время для встречи.",
  cases: "Напишите хозяину квартиры: опишите проблему в квартире, объясните, какая помощь нужна, предложите время ремонта и попросите подтверждение.",
  past: "Напишите другу о недавней поездке: куда вы ездили, что сделали, что понравилось и что хотите сделать в следующий раз.",
  reasons: "Напишите организатору встречи: объясните, почему вы не сможете прийти, сообщите, когда будете доступны, предложите новое время и попросите ответ.",
  requests: "Напишите организатору курса: объясните, почему не можете прийти, попросите перенос, предложите два времени и спросите о материалах.",
  opinions: "Объясните свое мнение о телефонах у детей: назовите преимущество, недостаток, личный пример и свой вывод.",
  planning: "Напишите другу и предложите совместное занятие в выходные: что делать, где встретиться, когда и что нужно подготовить.",
  reading: "Ответьте на письмо о курсе: подтвердите участие, уточните время, спросите о материалах и сообщите, когда сможете записаться.",
  writing: "Напишите знакомой Анне: поблагодарите за приглашение на курс, объясните, почему не можете прийти в понедельник, предложите другой день и спросите о материалах.",
};

export function skillStatus(progress: UserProgress, skillId: SkillId, today = toISODate()) {
  const evidence = progress.skillEvidence[skillId] ?? [];
  if (!evidence.length) return "unassessed";
  const latest = evidence.at(-1)!;
  if (!latest.successful) return "learning";
  const successes = evidence.filter((item) => item.successful);
  const latestFailure = evidence.findLastIndex((item) => !item.successful);
  const recent = evidence.slice(latestFailure + 1).filter((item) => item.successful);
  const first = recent[0];
  // A transparent product rule, not an exam certification or universal learning threshold.
  if (skillId !== "writing" && recent.length >= 2 && new Set(recent.map((item) => item.taskKey).filter(Boolean)).size >= 2 && first && new Date(latest.date).getTime() - new Date(first.date).getTime() >= 3 * 86400000 && new Date(today).getTime() - new Date(latest.date).getTime() <= 30 * 86400000) return "retained";
  return successes.length ? "practicing" : "learning";
}

export const statusLabels = { unassessed: "Нет проверки", learning: "Нужна практика", practicing: "Получается", retained: "Подтверждено спустя время" };

export function nextSkill(progress: UserProgress, today = toISODate()): SkillId {
  const dueMistake = progress.mistakeLog.find((item) => item.status !== "retained" && item.dueAt <= today);
  if (dueMistake) return dueMistake.skillId;
  const ready = skills.filter((skill) => skill.prerequisites.every((id) => ["practicing", "retained"].includes(skillStatus(progress, id, today))));
  return [...ready].sort((a, b) => {
    const weight = (id: SkillId) => ({ learning: 0, unassessed: 1, practicing: 2, retained: 3 })[skillStatus(progress, id, today)];
    return weight(a.id) - weight(b.id) || (progress.skillEvidence[a.id].at(-1)?.date ?? "").localeCompare(progress.skillEvidence[b.id].at(-1)?.date ?? "");
  })[0]?.id ?? "word-order";
}

export function makePracticeLesson(progress: UserProgress, skillId = nextSkill(progress), date = new Date(), kind: Lesson["kind"] = "lesson"): Lesson {
  const skill = skills.find((item) => item.id === skillId)!;
  const count = progress.attempts.length;
  const id = `${kind}-${skillId}-${toISODate(date)}-${count}`;
  const topic = topicForSkill[skillId];
  const exercises = kind === "diagnostic"
    ? skills.map((item) => ({ ...skillExercises[item.id][0], id: `${id}-${item.id}` }))
    : [...skillExercises[skillId].slice(count % 3), ...skillExercises[skillId].slice(0, count % 3)].slice(0, 2).map((exercise) => ({ ...exercise, id: `${id}-${exercise.id}` }));
  const readingTexts = ["Liebe Kursteilnehmer, unser Deutschkurs beginnt am Montag um 18 Uhr. Der Unterricht dauert zwei Stunden. Bitte melden Sie sich bis Freitag per E-Mail an. Am ersten Tag brauchen Sie ein Heft. Viele Grüße, Anna Weber", "Liebe Kursteilnehmer, der neue Kurs beginnt am Mittwoch um 17 Uhr und dauert drei Stunden. Bitte melden Sie sich bis Montag an. Bringen Sie ein Wörterbuch mit. Viele Grüße, Anna Weber", "Liebe Kursteilnehmer, am Donnerstag findet der Kurs von 19 bis 20 Uhr statt. Die Anmeldung endet am Dienstag. Bitte bringen Sie einen Laptop mit. Viele Grüße, Anna Weber"];
  const readingText = readingTexts[count % readingTexts.length];
  const readingAnswers = ["ein Heft", "ein Wörterbuch", "einen Laptop"];
  if (kind !== "diagnostic") exercises.push(make(`${id}-reading`, "reading", "Прочитайте письмо выше. Что нужно принести? Скопируйте словосочетание из двух слов.", readingAnswers[count % 3], "Найдите в письме предмет, который нужно принести.", "reading"));
  return {
    id, skillId, kind, examId: progress.examId, title: kind === "diagnostic" ? "Начальная проверка: грамматика, чтение и письмо" : `${kind === "checkpoint" ? "Контрольная практика" : skill.title}: ${topic}`,
    level: progress.targetLevel, topic, studyDay: progress.completedLessonIds.length + 1, estimatedMinutes: kind === "diagnostic" ? 25 : 35,
    timeLimitMinutes: kind === "checkpoint" ? (progress.examId === "telc-b1" ? 30 : 60) : undefined,
    warmUpReview: kind === "diagnostic" ? "Ответьте без подсказок. Это начальное наблюдение отдельных умений, а не определение общего уровня языка." : `${skill.goal}. Сначала повторите старые слова, затем выполните задания и исправьте ошибки.`,
    vocabularyIds: vocabulary.filter((word) => word.topic === topic).slice(0, 4).map((word) => word.id),
    grammar: { title: skill.title, ...grammarContent[skillId] },
    readingText, exercises,
    freePromptRu: `${writingGoals[skillId]} ${progress.examId === "telc-b1" ? "Отработайте все четыре коммуникативных пункта письма." : skillId === "opinions" ? "Оформите ответ как короткое сообщение в форуме." : "Выберите подходящий адресату регистр."} Это учебное задание, не полный экзаменационный модуль.`,
    successCriteria: ["Сделана самостоятельная попытка каждого задания.", "Найдена информация в тексте.", "Письмо выполняет все пункты задания.", "Ошибки исправлены самостоятельно и назначены на повторение."], source: "fallback",
  };
}
