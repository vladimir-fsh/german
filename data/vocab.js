/* Словарь для повседневного общения: основной вариант - обычное слово или
   выражение; более формальное / книжное - только в reg на обороте.
   f - приблизительная учебная очередь от базовой к более сложной лексике,
   а не измеренный корпусный ранг частотности и не оценка уровня CEFR.
   id сохраняет прежний ключ карточки при смене основного варианта:
   расписание, закрытые слова и незавершённые сессии продолжают работать. */
window.VOCAB = [
  /* Группа 1: базовые повседневные слова */
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
  { id: "die Voraussetzung", f: 1, de: "brauchen", ru: "нуждаться в", ex: "Für den Job brauchst du gute Deutschkenntnisse.", exru: "Для этой работы тебе нужно хорошо знать немецкий.", reg: "Официальнее: die Voraussetzung (необходимое условие). Здесь: Gute Deutschkenntnisse sind die Voraussetzung." },
  { id: "ausreichend", f: 1, de: "genug", ru: "достаточно", ex: "Wir haben genug Geld für die Reise.", exru: "У нас достаточно денег на поездку.", reg: "Официальнее: ausreichend (достаточный, достаточно)." },
  { id: "gelegentlich", f: 1, de: "manchmal", ru: "иногда", ex: "Wir treffen uns manchmal im Park.", exru: "Мы иногда встречаемся в парке.", reg: "Более книжный вариант: gelegentlich (время от времени)." },
  { id: "bewältigen", f: 1, de: "schaffen", ru: "справляться, осилить", ex: "Ich schaffe das auch ohne Hilfe.", exru: "Я справлюсь с этим и без помощи.", reg: "Более формально: bewältigen (справляться с трудной задачей)." },
  { id: "der Stellenwert", f: 1, de: "wichtig sein", ru: "быть важным", ex: "Meine Familie ist mir sehr wichtig.", exru: "Моя семья для меня очень важна.", reg: "Официальнее: der Stellenwert (значимость); einen hohen Stellenwert haben (иметь большое значение)." },
  { id: "gravierend", f: 1, de: "schlimm", ru: "плохой, серьёзный (о проблеме)", ex: "Ist der Fehler wirklich so schlimm?", exru: "Ошибка действительно настолько серьёзная?", reg: "Более формально: gravierend (серьёзный, с тяжёлыми последствиями). Сильнее, чем просто schlimm." },

  /* Группа 2: повседневные ситуации */
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
  { id: "ablehnen", f: 2, de: "Nein sagen", ru: "отказывать, говорить «нет»", ex: "Du kannst auch mal Nein sagen.", exru: "Ты тоже можешь иногда сказать «нет».", reg: "Нейтральнее: ablehnen (отклонять, отказываться). Например: ein Angebot ablehnen." },
  { id: "die Bereitschaft", f: 2, de: "bereit sein", ru: "быть готовым", ex: "Bist du bereit, mir zu helfen?", exru: "Ты готов мне помочь?", reg: "Официальнее: die Bereitschaft (готовность что-то сделать)." },
  { id: "die Gelassenheit", f: 2, de: "ruhig bleiben", ru: "сохранять спокойствие", ex: "Bleib ruhig, wir finden eine Lösung.", exru: "Сохраняй спокойствие, мы найдём решение.", reg: "Более книжное близкое понятие: die Gelassenheit (спокойствие, невозмутимость)." },
  { id: "erörtern", f: 2, de: "besprechen", ru: "обсуждать", ex: "Wir besprechen das morgen in Ruhe.", exru: "Мы спокойно обсудим это завтра.", reg: "Более формально: erörtern (подробно обсуждать, разбирать вопрос)." },

  /* Группа 3: мнения и последствия */
  { f: 3, de: "der Eindruck", ru: "впечатление", ex: "Sie macht einen ruhigen Eindruck.", exru: "Она производит спокойное впечатление." },
  { f: 3, de: "der Zusammenhang", ru: "взаимосвязь, контекст", ex: "Ich sehe keinen Zusammenhang zwischen den Ereignissen.", exru: "Я не вижу связи между этими событиями." },
  { f: 3, de: "die Gewohnheit", ru: "привычка", ex: "Rauchen ist eine schlechte Gewohnheit.", exru: "Курение — плохая привычка." },
  { id: "die Auswirkung", f: 3, de: "die Folge", ru: "последствие", ex: "Zu wenig Schlaf kann schlimme Folgen haben.", exru: "Недостаток сна может иметь серьёзные последствия.", reg: "В отчётах также: die Auswirkung (воздействие, последствие)." },
  { f: 3, de: "beeinflussen", ru: "влиять", ex: "Werbung beeinflusst unsere Entscheidungen.", exru: "Реклама влияет на наши решения." },
  { f: 3, de: "sich beschweren", ru: "жаловаться", ex: "Die Gäste beschweren sich über den Service.", exru: "Гости жалуются на обслуживание." },
  { f: 3, de: "betonen", ru: "подчёркивать", ex: "Der Chef betont, dass alle pünktlich sein müssen.", exru: "Начальник подчёркивает, что все должны быть пунктуальны." },
  { f: 3, de: "vermuten", ru: "предполагать", ex: "Ich vermute, dass sie schon weg ist.", exru: "Я предполагаю, что она уже ушла." },
  { id: "die Zuversicht", f: 3, de: "optimistisch sein", ru: "быть настроенным оптимистично", ex: "Trotz der Probleme bin ich optimistisch.", exru: "Несмотря на проблемы, я настроен оптимистично.", reg: "Более книжное близкое понятие: die Zuversicht (уверенность в хорошем исходе)." },
  { id: "beiläufig", f: 3, de: "nebenbei", ru: "попутно, между прочим", ex: "Das hat er nur so nebenbei gesagt.", exru: "Он сказал это просто между прочим.", reg: "Более книжное в этом значении: beiläufig (вскользь, мимоходом)." },

  /* Группа 4: более сложные выражения */
  { f: 4, de: "die Herausforderung", ru: "вызов, трудная задача", ex: "Der neue Job ist eine große Herausforderung.", exru: "Новая работа — большой вызов." },
  { f: 4, de: "das Vorurteil", ru: "предрассудок", ex: "Viele Menschen haben Vorurteile gegen Fremde.", exru: "У многих людей есть предрассудки против чужаков." },
  { f: 4, de: "nachvollziehen", ru: "понять ход мысли, проследить", ex: "Ich kann deine Entscheidung gut nachvollziehen.", exru: "Я вполне понимаю твоё решение." },
  { f: 4, de: "vorübergehend", ru: "временный, временно", ex: "Das Geschäft ist vorübergehend geschlossen.", exru: "Магазин временно закрыт." },
  { id: "beharren auf", f: 4, de: "bestehen auf", ru: "настаивать на", ex: "Ich bestehe darauf, dass du mitkommst.", exru: "Я настаиваю на том, чтобы ты пошёл с нами.", reg: "Более книжное: beharren auf (упорно настаивать на своём). Оба глагола: auf + Dativ." },
  { id: "unvermeidlich", f: 4, de: "sich nicht vermeiden lassen", ru: "быть неизбежным; нельзя избежать", ex: "Das lässt sich leider nicht vermeiden.", exru: "Этого, к сожалению, не избежать.", reg: "Более книжное: unvermeidlich (неизбежный)." },

  /* Группа 5: более специальная лексика для обсуждений */
  { f: 5, de: "die Nachhaltigkeit", ru: "устойчивость, экологичность", ex: "Die Firma spricht viel über Nachhaltigkeit.", exru: "Фирма много говорит об экологичности." },
  { f: 5, de: "hinterfragen", ru: "ставить под вопрос", ex: "Man sollte alte Regeln manchmal hinterfragen.", exru: "Старые правила иногда стоит ставить под вопрос." },
  { f: 5, de: "umstritten", ru: "спорный", ex: "Das Gesetz ist sehr umstritten.", exru: "Этот закон очень спорный." },
  { f: 5, de: "anspruchsvoll", ru: "требовательный, взыскательный", ex: "Der Kurs ist anspruchsvoll, aber interessant.", exru: "Курс требовательный, но интересный." }
];
