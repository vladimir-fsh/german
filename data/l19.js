/* Lektion 19 — Nebensätze 1: weil, dass.
   Источник тем и лексики: lehrerlenz.de/lektion_19_nebenstze_1_dass_weil.html */
window.L19 = {
  n: 19,
  title: "Nebensätze 1: weil, dass",
  ru: "Придаточные с weil и dass: глагол уезжает в конец",

  grammar: [
    {
      title: "Придаточное: глагол уезжает в конец",
      html: `
<p>До этого урока все предложения были простыми: глагол стоял на втором месте и никуда не двигался. Придаточное предложение (<span class="de">Nebensatz</span>) ломает эту привычку ровно в одном месте — <b>спрягаемый глагол уходит в самый конец</b>.</p>

<div class="ex"><span class="de">Ich bleibe zu Hause. <b>→</b> Ich bleibe zu Hause, weil ich krank <b>bin</b>.</span>
<span class="ru">Я остаюсь дома. → Я остаюсь дома, потому что я болен.</span></div>

<div class="hack">
  <span class="lbl">Хак № 1 · глагол — последний вагон</span>
  Увидел <span class="de">weil</span> или <span class="de">dass</span> — сразу возьми спрягаемый глагол и прицепи его в самый хвост.
  <span class="big">weil · ich · krank · <u>bin</u></span>
  Запятая перед союзом обязательна: в немецком она не «по интонации», а по грамматике.
</div>

<div class="flow">
  <div class="step"><div class="txt">Скажи мысль простым предложением.<i>Ich bin krank.</i></div></div>
  <div class="step"><div class="txt">Поставь запятую и союз.<i>…, weil ich bin krank</i></div></div>
  <div class="step"><div class="txt">Возьми спрягаемый глагол и отправь в конец.<i>…, weil ich krank <span class="end">bin</span>.</i></div></div>
</div>

<div class="note"><b>Это главная ошибка урока.</b> <span class="de">weil ich <b>bin</b> krank</span> — так говорить нельзя, хотя по-русски порядок именно такой. Правильно только <span class="de">weil ich krank <b>bin</b></span>.</div>
`
    },

    {
      title: "weil или denn — один смысл, разный порядок слов",
      html: `
<p>Оба переводятся «потому что». Разница не в значении, а в том, трогают ли они порядок слов.</p>

<div class="matrix" style="grid-template-columns: repeat(4, 1fr)">
  <div class="cell head">союз</div><div class="cell head">подлежащее</div><div class="cell head">…</div><div class="cell head">глагол</div>
  <div class="cell m"><b>denn</b>союз</div><div class="cell">ich</div><div class="cell hl"><b>bin</b>глагол здесь</div><div class="cell">krank</div>
  <div class="cell n"><b>weil</b>союз</div><div class="cell">ich</div><div class="cell">krank</div><div class="cell hl"><b>bin</b>глагол здесь</div>
</div>

<p>Подвижна ровно одна клетка — место глагола. Всё остальное в двух строчках одинаково.</p>

<div class="hack">
  <span class="lbl">Хак № 2 · denn ничего не двигает</span>
  <span class="de">denn</span> — это просто «и вот почему», после него предложение остаётся как было.
  <span class="big">denn → всё на местах<br>weil → глагол в хвост</span>
</div>

<div class="rhyme">denn — <span>как есть</span>, weil — <span>глагол в хвост</span></div>

<div class="ex"><span class="de">Ich gehe nicht schwimmen, <b>denn</b> das Wasser <b>ist</b> zu kalt.<br>Ich gehe nicht schwimmen, <b>weil</b> das Wasser zu kalt <b>ist</b>.</span>
<span class="ru">Я не пойду купаться, потому что вода слишком холодная.</span></div>

<div class="note">На вопрос <span class="de">Warum?</span> в разговоре чаще отвечают через <span class="de">weil</span>, а коротким ответом — просто придаточным: <span class="de">Warum bleibst du zu Hause? — Weil ich krank bin.</span></div>
`
    },

    {
      title: "dass — упаковка целого предложения",
      html: `
<p><span class="de">dass</span> превращает целое предложение в одно дополнение — «то, что …». Глагол при этом ведёт себя так же: уезжает в конец.</p>

<div class="cut">
  Er <span class="tail">kommt</span> morgen. <span class="arrow">→</span> Ich weiß, dass er morgen <span class="tail">kommt</span>.
  <small>глагол переехал в хвост</small>
</div>

<p>Глаголы, после которых обычно идёт <span class="de">dass</span>: <span class="de">sagen, wissen, glauben, hoffen, denken, finden, meinen, versprechen</span>.</p>

<div class="ex"><span class="de">Wir versprechen Ihnen, <b>dass</b> wir heute ganz lieb <b>sein wollen</b>.</span>
<span class="ru">Мы обещаем вам, что сегодня будем вести себя хорошо.</span></div>

<div class="hack">
  <span class="lbl">Хак № 3 · сначала скажи без dass</span>
  Составь простую фразу, потом упакуй её: поставь <span class="de">dass</span> и пни глагол в конец.
  <span class="big">Er hat recht. → Ich glaube, dass er recht <u>hat</u>.</span>
</div>

<div class="hack">
  <span class="lbl">Хак № 4 · проверка на «это»</span>
  <span class="de">das</span> с одной <b>s</b> — артикль или «это/которое», его можно заменить на <span class="de">dieses</span> или <span class="de">welches</span>.
  <span class="de">dass</span> с двумя — союз «что», заменить нельзя ничем.
  <span class="big">Das Auto, <u>das</u> dort steht … · Ich weiß, <u>dass</u> es teuer ist.</span>
</div>

<div class="note"><b>Ловушка.</b> <span class="de">Ich weiß, das er kommt</span> — ошибка в одной букве, но предложение разваливается. Если по-русски стоит «что» и дальше идёт целое предложение — пиши <span class="de">dass</span>.</div>
`
    },

    {
      title: "Когда глаголов в конце несколько",
      html: `
<p>Сложность не в самом правиле, а в случаях, где глагольных форм две. Порядок всегда один и тот же.</p>

<div class="hack">
  <span class="lbl">Хак № 5 · хозяин заходит последним</span>
  Спрягаемая форма (та, что согласуется с подлежащим) стоит <b>в самом конце</b>, остальные глаголы — перед ней.
  <span class="big">… arbeiten <u>muss</u> · … gekommen <u>ist</u> · … gemacht <u>haben</u></span>
</div>

<div class="matrix" style="grid-template-columns: repeat(4, 1fr)">
  <div class="cell head">что внутри</div><div class="cell head">простое</div><div class="cell head">в придаточном</div><div class="cell head">что изменилось</div>
  <div class="cell">Modalverb</div><div class="cell">Er <b>muss</b> arbeiten.</div><div class="cell">…, weil er arbeiten <b>muss</b>.</div><div class="cell hl">muss в конец</div>
  <div class="cell">Perfekt</div><div class="cell">Er <b>ist</b> gekommen.</div><div class="cell">…, weil er gekommen <b>ist</b>.</div><div class="cell hl">ist после Partizip</div>
  <div class="cell">trennbares Verb</div><div class="cell">Der Zug <b>fährt ab</b>.</div><div class="cell">…, weil der Zug <b>abfährt</b>.</div><div class="cell hl">приставка прилипла</div>
</div>

<div class="note"><b>Ловушка с отделяемой приставкой.</b> В придаточном <span class="de">ab</span> возвращается к глаголу и пишется слитно: <span class="de">weil der Zug um sechs <b>abfährt</b></span>, а не <span class="de">ab fährt</span> и не <span class="de">fährt ab</span>.</div>

<div class="note"><b>Ловушка с местоимением.</b> Возвратное <span class="de">sich</span> остаётся сразу после подлежащего, а не уезжает с глаголом: <span class="de">weil ich <b>mich</b> bei der Küchenarbeit nicht schmutzig machen möchte</span>.</div>
`
    },

    {
      title: "Придаточное впереди: запятая — это место № 1",
      html: `
<p>Придаточное можно поставить первым. Тогда оно целиком занимает первое место в главном предложении, а сразу после запятой идёт глагол главного — как в любом предложении с чем-то на первом месте.</p>

<div class="cut">
  Ich gehe ins Bett, <span class="tail">weil ich müde bin</span>. <span class="arrow">→</span> <span class="tail">Weil ich müde bin</span>, <b>gehe</b> ich ins Bett.
  <small>после запятой сразу глагол</small>
</div>

<div class="hack">
  <span class="lbl">Хак № 6 · запятая = место № 2</span>
  Придаточное впереди считается за одно слово. Значит следующая позиция — вторая, а на второй позиции всегда глагол.
  <span class="big">[Weil ich müde bin], <u>gehe</u> ich ins Bett.</span>
</div>

<div class="ex"><span class="de">Weil es regnet, <b>bleiben</b> wir zu Hause. · Weil er kein Geld hat, <b>kann</b> er nicht mitkommen.</span>
<span class="ru">Так как идёт дождь, мы остаёмся дома. · Так как у него нет денег, он не может пойти с нами.</span></div>

<div class="note"><b>Ловушка.</b> <span class="de">Weil es regnet, wir bleiben zu Hause</span> — самая частая ошибка при вынесенном придаточном. Подлежащее и глагол меняются местами: сначала <span class="de">bleiben</span>, потом <span class="de">wir</span>.</div>

<div class="note">С <span class="de">denn</span> так нельзя: <span class="de">denn</span> никогда не стоит в начале предложения.</div>
`
    }
  ],

  days: [
    {
      title: "weil: причина и глагол в конце",
      sub: "weil против denn, несколько глаголов, вынесенное придаточное",
      grammar: [0, 1, 3, 4],
      ex: [
        { type: "choice",
          prompt: "Какой вариант правильный?",
          q: "Я остаюсь дома, потому что я болен.",
          opts: ["Ich bleibe zu Hause, weil ich krank bin.", "Ich bleibe zu Hause, weil ich bin krank.", "Ich bleibe zu Hause, weil bin ich krank."], a: 0,
          why: "После weil спрягаемый глагол уходит в самый конец: weil ich krank bin. Русский порядок здесь сбивает — это главная ошибка урока." },

        { type: "choice",
          prompt: "Какой вариант правильный?",
          q: "Я не пойду купаться, потому что вода слишком холодная.",
          opts: ["Ich gehe nicht schwimmen, denn das Wasser ist zu kalt.", "Ich gehe nicht schwimmen, denn das Wasser zu kalt ist.", "Ich gehe nicht schwimmen, denn ist das Wasser zu kalt."], a: 0,
          why: "denn порядок слов не трогает: после него обычное предложение, глагол на втором месте. Двигает только weil." },

        { type: "choice",
          q: "Er kann heute nicht kommen, weil er ___ .",
          opts: ["arbeiten muss", "muss arbeiten", "arbeiten müssen"], a: 0,
          ru: "Он сегодня не может прийти, потому что должен работать.",
          why: "Спрягаемая форма стоит последней: сначала Infinitiv arbeiten, потом muss." },

        { type: "fill",
          q: "Die Schüler lachen, weil sie ihre Hausaufgaben nicht gemacht {}.",
          a: ["haben"],
          ru: "Ученики смеются, потому что не сделали домашнее задание.",
          why: "Perfekt в придаточном: Partizip gemacht, а спрягаемое haben — в самом конце." },

        { type: "fill",
          q: "Ich trage eine Schürze, weil ich mich bei der Küchenarbeit nicht schmutzig machen {}.",
          a: [["möchte", "will"]],
          ru: "Я ношу фартук, потому что не хочу испачкаться во время готовки.",
          why: "Модальный глагол — спрягаемый, поэтому он последний, после machen. Возвратное mich при этом остаётся сразу после ich." },

        { type: "choice",
          q: "Sie ist müde, weil sie zu spät ___ .",
          opts: ["ins Bett gegangen ist", "ist ins Bett gegangen", "gegangen ins Bett ist"], a: 0,
          ru: "Она устала, потому что поздно легла спать.",
          why: "В Perfekt вспомогательный глагол ist уезжает за Partizip: … gegangen ist." },

        { type: "fill",
          q: "Der Junge schämt sich, weil alle über ihn {}.",
          a: ["lachen"],
          ru: "Мальчику стыдно, потому что все над ним смеются.",
          why: "Подлежащее alle — глагол во множественном числе и в конце: lachen." },

        { type: "fill",
          q: "Ich komme später. Mein Bus hat Verspätung. → Ich komme später, {weil} mein Bus Verspätung {}.",
          a: [["weil"], ["hat"]],
          ru: "Я приду позже, потому что мой автобус опаздывает.",
          why: "Собираем придаточное: союз weil, дополнение Verspätung, спрягаемый hat в конце." },

        { type: "choice",
          q: "Ich muss früh aufstehen, weil der Zug um sechs ___ .",
          opts: ["abfährt", "ab fährt", "fährt ab"], a: 0,
          ru: "Мне нужно рано вставать, потому что поезд отходит в шесть.",
          why: "В придаточном отделяемая приставка возвращается к глаголу и пишется слитно: abfährt." },

        { type: "fill",
          q: "Warum trägst du eine Schürze? — {Weil} ich nicht schmutzig werden {}.",
          a: [["weil"], ["will", "möchte"]],
          ru: "Почему ты в фартуке? — Потому что не хочу испачкаться.",
          why: "Короткий ответ на Warum — это одно придаточное. Порядок в нём тот же: спрягаемое will последнее." },

        { type: "fill",
          q: "Sie ist glücklich, weil ihr Sohn die Prüfung {} hat.",
          a: ["bestanden"],
          ru: "Она счастлива, потому что её сын сдал экзамен.",
          why: "Partizip bestanden стоит перед hat: в придаточном спрягаемый глагол закрывает предложение." },

        { type: "pairs",
          prompt: "Соедини слово урока с переводом.",
          pairs: [["die Erziehung", "воспитание"], ["versprechen", "обещать"], ["verbieten", "запрещать"], ["bestrafen", "наказывать"], ["loben", "хвалить"], ["sich schämen", "стыдиться"]] },

        { type: "translate",
          ru: "Я не могу прийти, потому что должен работать.",
          a: ["Ich kann nicht kommen, weil ich arbeiten muss.", "Ich kann nicht kommen, weil ich arbeiten muss"],
          why: "Два глагола в конце: сначала Infinitiv arbeiten, потом спрягаемый muss." },

        { type: "translate",
          ru: "Мы остаёмся дома, потому что идёт дождь.",
          a: ["Wir bleiben zu Hause, weil es regnet.", "Wir bleiben zu Hause, weil es regnet"],
          why: "«Идёт дождь» — es regnet. В придаточном regnet встаёт в конец." },

        { type: "translate",
          ru: "Так как у него нет денег, он не может пойти с нами.",
          a: ["Weil er kein Geld hat, kann er nicht mitkommen.", "Weil er kein Geld hat, kann er nicht mitkommen"],
          why: "Придаточное впереди занимает место № 1, поэтому сразу после запятой идёт глагол главного: kann er, а не er kann." }
      ]
    }
  ],

  /* Запасник: задания, которых нет в дне. g — блок теории.
     Отсюда берётся «новое на ту же конструкцию» к ошибке и подмес в новые дни. */
  drill: [
    { g: 0, type: "fill",
      q: "Ich gehe nicht mit, weil ich keine Zeit {haben}.",
      a: ["habe"],
      ru: "Я не пойду, потому что у меня нет времени.",
      why: "После weil спрягаемый глагол — в самом конце: weil ich keine Zeit habe." },
    { g: 0, type: "fill",
      q: "Sie ist müde, weil sie schlecht {schlafen} hat.",
      a: ["geschlafen"],
      ru: "Она устала, потому что плохо спала.",
      why: "Perfekt в придаточном: Partizip geschlafen, за ним спрягаемое hat — последним." },
    { g: 1, type: "choice",
      q: "Ich komme heute nicht, ___ ich bin krank.",
      opts: ["denn", "weil"], a: 0,
      ru: "Я сегодня не приду, потому что болею.",
      why: "После пропуска обычный порядок: ich bin krank, глагол вторым. Так бывает только после denn." },
    { g: 1, type: "choice",
      q: "Ich komme heute nicht, ___ ich krank bin.",
      opts: ["denn", "weil"], a: 1,
      ru: "Я сегодня не приду, потому что болею.",
      why: "Глагол bin ушёл в конец — значит, перед ним weil. denn порядок слов не трогает." },
    { g: 1, type: "translate",
      ru: "Я пью кофе, потому что устал.",
      a: ["Ich trinke Kaffee, weil ich müde bin.", "Ich trinke Kaffee, denn ich bin müde."],
      why: "weil → глагол в конец: weil ich müde bin. С denn порядок обычный: denn ich bin müde." },
    { g: 0, type: "translate",
      ru: "Она плачет, потому что потеряла ключ.",
      a: ["Sie weint, weil sie ihren Schlüssel verloren hat.", "Sie weint, weil sie den Schlüssel verloren hat.", "Sie weint, denn sie hat ihren Schlüssel verloren.", "Sie weint, denn sie hat den Schlüssel verloren."],
      why: "Perfekt после weil: verloren hat — спрягаемое hat последним." },
    { g: 1, type: "translate",
      ru: "Мы остаёмся дома, потому что идёт дождь.",
      a: ["Wir bleiben zu Hause, weil es regnet.", "Wir bleiben zu Hause, denn es regnet.", "Wir bleiben daheim, weil es regnet."],
      why: "weil es regnet — глагол в конце. Если начал с denn — denn es regnet." },
    { g: 3, type: "fill",
      q: "Ich bin traurig, weil ich nicht zur Party kommen {können}.",
      a: ["kann"],
      ru: "Мне грустно, потому что я не могу прийти на вечеринку.",
      why: "Два глагола в конце: сначала инфинитив kommen, последним — спрягаемый модальный kann." },
    { g: 3, type: "fill",
      q: "Er ist nervös, weil er morgen die Prüfung machen {müssen}.",
      a: ["muss"],
      ru: "Он нервничает, потому что завтра должен сдавать экзамен.",
      why: "Модальный глагол спрягается и уходит в самый конец, после инфинитива: machen muss." },
    { g: 3, type: "fill",
      q: "Sie freut sich, weil sie die Stelle bekommen {}.",
      a: ["hat"],
      ru: "Она радуется, потому что получила место.",
      why: "Perfekt в придаточном: bekommen hat. Спрягаемая часть — последней." },
    { g: 3, type: "fill",
      q: "Wir kommen zu spät, weil wir den Bus verpasst {}.",
      a: ["haben"],
      ru: "Мы опаздываем, потому что пропустили автобус.",
      why: "verpasst haben: причастие, затем спрягаемое haben — в самом конце." },
    { g: 4, type: "choice",
      q: "Weil es so kalt ist, ___ heute zu Hause.",
      opts: ["bleiben wir", "wir bleiben", "wir zu Hause bleiben"], a: 0,
      ru: "Так как очень холодно, мы сегодня остаёмся дома.",
      why: "Придаточное впереди занимает место № 1. Сразу после запятой — глагол главного: bleiben wir." },
    { g: 4, type: "fill",
      q: "Weil der Zug Verspätung {haben}, {kommen} ich später.",
      a: ["hat", "komme"],
      ru: "Так как поезд опаздывает, я приду позже.",
      why: "В придаточном hat — в конце. После запятой глагол главного на втором месте, сразу за придаточным: komme ich." },
    { g: 4, type: "translate",
      ru: "Так как я болен, я не иду на работу.",
      a: ["Weil ich krank bin, gehe ich nicht zur Arbeit.", "Weil ich krank bin, gehe ich nicht arbeiten.", "Da ich krank bin, gehe ich nicht zur Arbeit."],
      why: "Придаточное впереди — место № 1, поэтому дальше gehe ich, а не ich gehe." },
    { g: 4, type: "translate",
      ru: "Так как у меня нет машины, я еду на автобусе.",
      a: ["Weil ich kein Auto habe, fahre ich mit dem Bus.", "Weil ich kein Auto habe, nehme ich den Bus.", "Da ich kein Auto habe, fahre ich mit dem Bus."],
      why: "weil ich kein Auto habe — глагол в конце, затем fahre ich — глагол сразу после запятой." },
    { g: 2, type: "fill",
      q: "Ich glaube, dass er heute nicht {kommen}.",
      a: ["kommt"],
      ru: "Я думаю, что он сегодня не придёт.",
      why: "dass работает как weil: спрягаемый глагол уходит в конец." },
    { g: 2, type: "fill",
      q: "Sie sagt, dass sie morgen früh aufstehen {müssen}.",
      a: ["muss"],
      ru: "Она говорит, что завтра должна рано встать.",
      why: "После dass модальный глагол — последним: aufstehen muss." },
    { g: 2, type: "translate",
      ru: "Я знаю, что ты прав.",
      a: ["Ich weiß, dass du recht hast.", "Ich weiß, dass du Recht hast."],
      why: "dass → глагол в конец: dass du recht hast." }
  ],

  /* 10 слов урока для карточек. Лексика из упражнений lehrerlenz к Lektion 19. */
  words: [
    { de: "die Erziehung", ru: "воспитание", ex: "Die Erziehung der Kinder ist nicht einfach.", exru: "Воспитание детей — дело непростое." },
    { de: "versprechen", ru: "обещать", ex: "Wir versprechen Ihnen, dass wir heute lieb sind.", exru: "Мы обещаем вам, что сегодня будем вести себя хорошо." },
    { de: "verbieten", ru: "запрещать", ex: "Meine Eltern verbieten mir das Handy am Abend.", exru: "Родители запрещают мне телефон по вечерам." },
    { de: "bestrafen", ru: "наказывать", ex: "Früher hat der Lehrer die Schüler hart bestraft.", exru: "Раньше учитель строго наказывал учеников." },
    { de: "loben", ru: "хвалить", ex: "Der Lehrer lobt die Schüler, weil sie fleißig sind.", exru: "Учитель хвалит учеников, потому что они прилежные." },
    { de: "sich schämen", ru: "стыдиться", ex: "Der Junge schämt sich, weil alle über ihn lachen.", exru: "Мальчику стыдно, потому что все над ним смеются." },
    { de: "das Opfer", ru: "жертва", ex: "Er fühlt sich als Opfer von Rassismus.", exru: "Он чувствует себя жертвой расизма." },
    { de: "der Rassismus", ru: "расизм", ex: "Rassismus beginnt oft mit einem dummen Witz.", exru: "Расизм часто начинается с глупой шутки." },
    { de: "zustimmen", ru: "соглашаться", ex: "Ich stimme dir zu, weil du recht hast.", exru: "Я с тобой согласен, потому что ты прав." },
    { de: "schlagen", ru: "бить, ударить", ex: "Kein Lehrer darf ein Kind schlagen.", exru: "Ни один учитель не имеет права бить ребёнка." }
  ],

  links: [
    { t: "Einstieg: Vater und Sohn — früher (H5P)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=349" },
    { t: "Einstieg: Vater und Sohn — heute (warum-Sätze)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=350" },
    { t: "Regeln: Nebensätze mit weil und dass (LearningApps)", url: "https://learningapps.org/watch?v=pwsvdmnw101" },
    { t: "Grammatik: weil oder denn (1)", url: "https://learningapps.org/watch?v=p1wvurtb501" },
    { t: "Grammatik: weil oder denn (2)", url: "https://learningapps.org/watch?v=pp7dorjca01" },
    { t: "Erziehung 1: Sätze mit dass ergänzen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=351" },
    { t: "Erziehung 2: dass-Sätze", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=352" },
    { t: "Erziehung 3: weil-Sätze", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=353" },
    { t: "Erziehung 4: weil und dass gemischt", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=354" },
    { t: "Erziehung 5: dass + Perfekt", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=355" },
    { t: "Erziehung 6: Abschlussübung", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=356" },
    { t: "Ist das eine gute Erziehung? (LearningApps)", url: "https://learningapps.org/watch?v=ppdmss5vc01" },
    { t: "Erziehung: Satzbau-Übung (LearningApps)", url: "https://learningapps.org/watch?v=pu88nf5x218" },
    { t: "Bildergeschichte (Genially)", url: "https://view.genially.com/6a3ffb6f9d091734296fdc47" },
    { t: "Bildergeschichte: Vater und Sohn (Genially)", url: "https://view.genially.com/6a40fc8fee4d82976a5aa6de" },
    { t: "Denkpause: Ist das Rassismus? — richtig oder falsch", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=362" },
    { t: "Lesepause: ein Jugendbuch (Genially)", url: "https://view.genially.com/6a40d77fa584853d8bd5d1de" }
  ]
};
