export type ExamSection = {
  id: string;
  title: string;
  duration: string;
  formatRu: string;
  practiceRoute: string;
  practiceLabel: string;
  focus: string[];
};

export type ExamProfile = {
  id: string;
  title: string;
  subtitle: string;
  descriptionRu: string;
  sections: ExamSection[];
};

export const examProfiles: ExamProfile[] = [
  {
    id: "goethe-b1",
    title: "Goethe-Zertifikat B1",
    subtitle: "4 отдельных модуля",
    descriptionRu:
      "Подходит как официальный B1-сертификат. Модули Lesen, Hören, Schreiben и Sprechen можно сдавать отдельно или вместе.",
    sections: [
      {
        id: "goethe-lesen",
        title: "Lesen",
        duration: "65 мин",
        formatRu: "Блоги, E-Mails, газетные тексты, объявления, инструкции.",
        practiceRoute: "/lesson",
        practiceLabel: "Читать в уроках",
        focus: ["главная мысль", "детали", "мнения", "объявления"],
      },
      {
        id: "goethe-hoeren",
        title: "Hören",
        duration: "40 мин",
        formatRu: "Объявления, короткие доклады, разговоры, радио-дискуссии.",
        practiceRoute: "/speaking",
        practiceLabel: "Тренировать слух и речь",
        focus: ["ключевые слова", "детали", "позиция говорящего", "контекст"],
      },
      {
        id: "goethe-schreiben",
        title: "Schreiben",
        duration: "60 мин",
        formatRu: "Личные и формальные письма, E-Mail, мнение в форуме.",
        practiceRoute: "/lesson",
        practiceLabel: "Писать ответ",
        focus: ["структура", "обращение", "аргументы", "корректный порядок слов"],
      },
      {
        id: "goethe-sprechen",
        title: "Sprechen",
        duration: "около 15 мин",
        formatRu:
          "Парная устная часть: разговор на бытовую тему, реакция на вопросы, мнение, предложения и свободная презентация.",
        practiceRoute: "/speaking",
        practiceLabel: "Практиковать говорение",
        focus: ["мнение", "причина", "пример", "презентация", "ответы на вопросы"],
      },
    ],
  },
  {
    id: "telc-b1",
    title: "telc Deutsch B1",
    subtitle: "письменная + устная часть",
    descriptionRu:
      "Частый формат для B1 в Германии. В письменной части есть Lesen, Sprachbausteine, Hören и Schreiben; отдельно проходит Sprechen.",
    sections: [
      {
        id: "telc-lesen-sprachbausteine",
        title: "Lesen + Sprachbausteine",
        duration: "90 мин",
        formatRu: "3 части Lesen и 2 части Sprachbausteine без паузы.",
        practiceRoute: "/lesson",
        practiceLabel: "Грамматика и чтение",
        focus: ["matching", "multiple choice", "лексика", "грамматические формы"],
      },
      {
        id: "telc-hoeren",
        title: "Hören",
        duration: "около 30 мин",
        formatRu: "3 части аудирования.",
        practiceRoute: "/speaking",
        practiceLabel: "Слушать вопросы",
        focus: ["ситуация", "цифры", "время", "отношение говорящего"],
      },
      {
        id: "telc-schreiben",
        title: "Schreiben",
        duration: "30 мин",
        formatRu: "1 письменное задание на основе ситуации.",
        practiceRoute: "/lesson",
        practiceLabel: "Письмо с AI-check",
        focus: ["все пункты задания", "формулы письма", "связки", "ясность"],
      },
      {
        id: "telc-sprechen",
        title: "Sprechen",
        duration: "около 15 мин + 20 мин подготовки",
        formatRu: "3 части, обычно 2 участника. Главное - живой обмен с партнером.",
        practiceRoute: "/speaking",
        practiceLabel: "Устная тренировка",
        focus: ["представиться", "обсудить", "спланировать", "договориться"],
      },
    ],
  },
  {
    id: "citizenship",
    title: "Einbürgerungstest",
    subtitle: "отдельно от B1",
    descriptionRu:
      "Это не языковой B1. Здесь нет тренировки B1-лексики; это отдельный тест по правовому и общественному порядку.",
    sections: [
      {
        id: "citizenship-test",
        title: "Testheft",
        duration: "60 мин",
        formatRu: "33 вопроса, по 4 варианта ответа. Нужно минимум 17 правильных.",
        practiceRoute: "/exam",
        practiceLabel: "Оставить отдельно",
        focus: ["демократия", "история", "общество", "Bundesland"],
      },
      {
        id: "citizenship-catalog",
        title: "Fragenkatalog",
        duration: "регулярно",
        formatRu: "Всего 310 вопросов: 300 общих и 10 по федеральной земле.",
        practiceRoute: "/exam",
        practiceLabel: "Не смешивать с B1",
        focus: ["Grundgesetz", "Wahl", "Behörde", "Rechte", "Pflichten"],
      },
    ],
  },
];

export const weeklyExamPlan = [
  "Понедельник: урок + 10 минут Lesen.",
  "Вторник: письмо или E-Mail с AI-проверкой.",
  "Среда: словарь по B1-темам и Sprachbausteine.",
  "Четверг: текстовый диалог, предложения и согласование плана.",
  "Пятница: контрольная практика отдельных задач с таймером.",
];
