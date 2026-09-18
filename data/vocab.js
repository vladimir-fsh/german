/* Общий словарь A2 → B1 для карточек.
   f — ступень частотности: 1 — самые ходовые слова, 5 — редкие, уже на грани B2.
   Приложение само двигает ступень: знаешь новые слова с первого раза — следующая
   порция берётся менее частотная, ошибаешься — возвращается более ходовая. */
window.VOCAB = [
  /* ---------- ступень 1: базовый A2, встречается постоянно ---------- */
  { f: 1, de: "die Möglichkeit", ru: "возможность", ex: "Es gibt noch eine andere Möglichkeit.", exru: "Есть ещё одна возможность." },
  { f: 1, de: "der Grund", ru: "причина", ex: "Aus diesem Grund komme ich später.", exru: "По этой причине я приду позже." },
  { f: 1, de: "die Meinung", ru: "мнение", ex: "Meiner Meinung nach ist das falsch.", exru: "По моему мнению, это неверно." },
  { f: 1, de: "die Erfahrung", ru: "опыт", ex: "Sie hat viel Erfahrung mit Kindern.", exru: "У неё большой опыт работы с детьми." },
  { f: 1, de: "die Entscheidung", ru: "решение", ex: "Das war keine leichte Entscheidung.", exru: "Это было нелёгкое решение." },
  { f: 1, de: "der Vorschlag", ru: "предложение, идея", ex: "Ich habe einen guten Vorschlag.", exru: "У меня есть хорошее предложение." },
  { f: 1, de: "die Beziehung", ru: "отношения", ex: "Die beiden haben eine gute Beziehung.", exru: "У них двоих хорошие отношения." },
  { f: 1, de: "erklären", ru: "объяснять", ex: "Kannst du mir das noch einmal erklären?", exru: "Можешь объяснить мне это ещё раз?" },
  { f: 1, de: "beschreiben", ru: "описывать", ex: "Beschreiben Sie bitte die Person.", exru: "Опишите, пожалуйста, этого человека." },
  { f: 1, de: "vergleichen", ru: "сравнивать", ex: "Man kann die zwei Städte nicht vergleichen.", exru: "Эти два города сравнивать нельзя." },
  { f: 1, de: "bedeuten", ru: "означать", ex: "Was bedeutet dieses Wort?", exru: "Что означает это слово?" },
  { f: 1, de: "erlauben", ru: "разрешать", ex: "Meine Eltern erlauben mir das nicht.", exru: "Родители мне этого не разрешают." },
  { f: 1, de: "trotzdem", ru: "тем не менее, всё равно", ex: "Es war kalt, trotzdem sind wir schwimmen gegangen.", exru: "Было холодно, но мы всё равно пошли купаться." },
  { f: 1, de: "außerdem", ru: "кроме того", ex: "Die Wohnung ist teuer, außerdem ist sie zu klein.", exru: "Квартира дорогая, кроме того, она слишком маленькая." },
  { f: 1, de: "wahrscheinlich", ru: "вероятно", ex: "Er kommt wahrscheinlich morgen.", exru: "Вероятно, он приедет завтра." },
  { f: 1, de: "eigentlich", ru: "вообще-то, собственно", ex: "Eigentlich wollte ich zu Hause bleiben.", exru: "Вообще-то я хотел остаться дома." },

  /* ---------- ступень 2: уверенный A2 — начало B1 ---------- */
  { f: 2, de: "die Verantwortung", ru: "ответственность", ex: "Er übernimmt die Verantwortung für das Projekt.", exru: "Он берёт на себя ответственность за проект." },
  { f: 2, de: "der Vorteil", ru: "преимущество", ex: "Das Auto hat einen großen Vorteil: es ist billig.", exru: "У этой машины большое преимущество: она дешёвая." },
  { f: 2, de: "der Nachteil", ru: "недостаток", ex: "Der Nachteil ist die lange Fahrt.", exru: "Недостаток — долгая дорога." },
  { f: 2, de: "die Bedingung", ru: "условие", ex: "Ich helfe dir unter einer Bedingung.", exru: "Я помогу тебе при одном условии." },
  { f: 2, de: "die Fähigkeit", ru: "способность", ex: "Sie hat die Fähigkeit, andere zu überzeugen.", exru: "У неё есть способность убеждать других." },
  { f: 2, de: "die Umgebung", ru: "окрестности, окружение", ex: "In der Umgebung gibt es einen schönen See.", exru: "В окрестностях есть красивое озеро." },
  { f: 2, de: "sich bewerben", ru: "подавать заявку, устраиваться", ex: "Ich bewerbe mich um eine neue Stelle.", exru: "Я устраиваюсь на новую работу." },
  { f: 2, de: "sich kümmern um", ru: "заботиться о", ex: "Wer kümmert sich um den Hund?", exru: "Кто позаботится о собаке?" },
  { f: 2, de: "teilnehmen an", ru: "участвовать в", ex: "Wir nehmen an dem Wettbewerb teil.", exru: "Мы участвуем в конкурсе." },
  { f: 2, de: "verzichten auf", ru: "отказываться от", ex: "Er verzichtet auf das Auto und fährt Rad.", exru: "Он отказывается от машины и ездит на велосипеде." },
  { f: 2, de: "erreichen", ru: "достигать, дозвониться", ex: "Ich habe mein Ziel erreicht.", exru: "Я достиг своей цели." },
  { f: 2, de: "vermeiden", ru: "избегать", ex: "Man sollte solche Fehler vermeiden.", exru: "Таких ошибок следует избегать." },
  { f: 2, de: "neulich", ru: "недавно", ex: "Neulich habe ich ihn in der Stadt getroffen.", exru: "Недавно я встретил его в городе." },
  { f: 2, de: "ständig", ru: "постоянно", ex: "Mein Nachbar hört ständig laute Musik.", exru: "Мой сосед постоянно слушает громкую музыку." },

  /* ---------- ступень 3: середина B1 ---------- */
  { f: 3, de: "der Eindruck", ru: "впечатление", ex: "Sie macht einen ruhigen Eindruck.", exru: "Она производит спокойное впечатление." },
  { f: 3, de: "der Zusammenhang", ru: "взаимосвязь, контекст", ex: "Ich sehe keinen Zusammenhang zwischen den Ereignissen.", exru: "Я не вижу связи между этими событиями." },
  { f: 3, de: "die Voraussetzung", ru: "предпосылка, условие", ex: "Gute Deutschkenntnisse sind die Voraussetzung für den Job.", exru: "Хорошее знание немецкого — условие для этой работы.", reg: "официальное · в разговоре чаще: man braucht …" },
  { f: 3, de: "die Gewohnheit", ru: "привычка", ex: "Rauchen ist eine schlechte Gewohnheit.", exru: "Курение — плохая привычка." },
  { f: 3, de: "die Auswirkung", ru: "последствие, воздействие", ex: "Der Lärm hat Auswirkungen auf die Gesundheit.", exru: "Шум влияет на здоровье.", reg: "язык газет · в разговоре: Folgen" },
  { f: 3, de: "beeinflussen", ru: "влиять", ex: "Werbung beeinflusst unsere Entscheidungen.", exru: "Реклама влияет на наши решения." },
  { f: 3, de: "sich beschweren", ru: "жаловаться", ex: "Die Gäste beschweren sich über den Service.", exru: "Гости жалуются на обслуживание." },
  { f: 3, de: "ablehnen", ru: "отклонять, отказываться", ex: "Er hat mein Angebot abgelehnt.", exru: "Он отклонил моё предложение.", reg: "нейтрально-официальное · в разговоре: Nein sagen" },
  { f: 3, de: "betonen", ru: "подчёркивать", ex: "Der Chef betont, dass alle pünktlich sein müssen.", exru: "Начальник подчёркивает, что все должны быть пунктуальны." },
  { f: 3, de: "vermuten", ru: "предполагать", ex: "Ich vermute, dass sie schon weg ist.", exru: "Я предполагаю, что она уже ушла." },
  { f: 3, de: "ausreichend", ru: "достаточный", ex: "Das Geld ist nicht ausreichend für die Reise.", exru: "Денег недостаточно для поездки.", reg: "официальное · в разговоре: genug" },
  { f: 3, de: "gelegentlich", ru: "время от времени", ex: "Wir sehen uns gelegentlich im Park.", exru: "Мы время от времени видимся в парке.", reg: "книжное · в разговоре: manchmal" },

  /* ---------- ступень 4: зрелый B1, слова из газет и дискуссий ---------- */
  { f: 4, de: "die Herausforderung", ru: "вызов, трудная задача", ex: "Der neue Job ist eine große Herausforderung.", exru: "Новая работа — большой вызов.", reg: "деловой язык и газеты" },
  { f: 4, de: "die Bereitschaft", ru: "готовность", ex: "Er zeigt keine Bereitschaft zu helfen.", exru: "Он не проявляет готовности помочь.", reg: "книжное · в разговоре: bereit sein" },
  { f: 4, de: "das Vorurteil", ru: "предрассудок", ex: "Viele Menschen haben Vorurteile gegen Fremde.", exru: "У многих людей есть предрассудки против чужаков." },
  { f: 4, de: "die Nachhaltigkeit", ru: "устойчивость, экологичность", ex: "Die Firma spricht viel über Nachhaltigkeit.", exru: "Фирма много говорит об экологичности.", reg: "язык газет и рекламы" },
  { f: 4, de: "bewältigen", ru: "справляться", ex: "Sie bewältigt die Arbeit ohne Hilfe.", exru: "Она справляется с работой без помощи.", reg: "книжное · в разговоре: schaffen" },
  { f: 4, de: "nachvollziehen", ru: "понять ход мысли, проследить", ex: "Ich kann deine Entscheidung gut nachvollziehen.", exru: "Я вполне понимаю твоё решение." },
  { f: 4, de: "hinterfragen", ru: "ставить под вопрос", ex: "Man sollte alte Regeln manchmal hinterfragen.", exru: "Старые правила иногда стоит ставить под вопрос.", reg: "книжное · в разговоре: nachfragen" },
  { f: 4, de: "umstritten", ru: "спорный", ex: "Das Gesetz ist sehr umstritten.", exru: "Этот закон очень спорный.", reg: "язык газет" },
  { f: 4, de: "anspruchsvoll", ru: "требовательный, взыскательный", ex: "Der Kurs ist anspruchsvoll, aber interessant.", exru: "Курс требовательный, но интересный." },
  { f: 4, de: "vorübergehend", ru: "временный, временно", ex: "Das Geschäft ist vorübergehend geschlossen.", exru: "Магазин временно закрыт." },

  /* ---------- ступень 5: редкое, уже почти B2 ---------- */
  { f: 5, de: "die Zuversicht", ru: "уверенность в хорошем исходе", ex: "Trotz der Probleme hat er seine Zuversicht behalten.", exru: "Несмотря на проблемы, он сохранил уверенность.", reg: "книжное · в разговоре: optimistisch sein" },
  { f: 5, de: "die Gelassenheit", ru: "невозмутимость", ex: "Sie reagiert immer mit großer Gelassenheit.", exru: "Она всегда реагирует с большой невозмутимостью.", reg: "книжное · в разговоре: ruhig bleiben" },
  { f: 5, de: "der Stellenwert", ru: "значимость, место в ряду", ex: "Bildung hat bei uns einen hohen Stellenwert.", exru: "Образование имеет у нас большую значимость.", reg: "книжное · в разговоре: wichtig sein" },
  { f: 5, de: "beharren auf", ru: "настаивать на", ex: "Er beharrt auf seiner Meinung.", exru: "Он настаивает на своём мнении.", reg: "книжное · в разговоре: darauf bestehen" },
  { f: 5, de: "erörtern", ru: "обстоятельно обсуждать", ex: "Im Unterricht erörtern wir aktuelle Themen.", exru: "На занятии мы обстоятельно обсуждаем актуальные темы.", reg: "книжное, школа и экзамен · в разговоре: besprechen" },
  { f: 5, de: "gravierend", ru: "серьёзный, тяжёлый (о проблеме)", ex: "Das ist ein gravierender Fehler.", exru: "Это серьёзная ошибка.", reg: "книжное · в разговоре: sehr schlimm" },
  { f: 5, de: "beiläufig", ru: "вскользь, мимоходом", ex: "Er hat das nur beiläufig erwähnt.", exru: "Он упомянул об этом лишь вскользь.", reg: "книжное · в разговоре: nebenbei" },
  { f: 5, de: "unvermeidlich", ru: "неизбежный", ex: "Ein Streit war unvermeidlich.", exru: "Ссора была неизбежна.", reg: "книжное · в разговоре: nicht zu vermeiden" }
];
