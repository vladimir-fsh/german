/* Lektion 20 — Nebensätze 2: abhängige Fragesätze, wenn-Sätze, Verben mit Präposition.
   Источник тем и лексики: lehrerlenz.de/lektion_20__nebenstze_2_abhngige_fragestze_wennstze.html */
window.L20 = {
  n: 20,
  title: "Nebensätze 2 + Verben mit Präposition",
  ru: "Косвенные вопросы, ob, wenn и глаголы с постоянным предлогом",

  grammar: [
    {
      title: "Косвенный вопрос: вопросительное слово работает как союз",
      html: `
<p>Вопрос можно задать прямо — <span class="de">Wo wohnst du?</span> — а можно «завернуть» в другое предложение: <span class="de">Ich weiß nicht, wo du wohnst.</span> Во втором случае это уже придаточное, и правило из урока 19 срабатывает целиком: <b>спрягаемый глагол уходит в конец</b>.</p>

<div class="ex"><span class="de">Wo <b>wohnst</b> du? <b>→</b> Sag mir, wo du <b>wohnst</b>.<br>Wann <b>fängt</b> der Film <b>an</b>? <b>→</b> Weißt du, wann der Film <b>anfängt</b>?</span>
<span class="ru">Где ты живёшь? → Скажи мне, где ты живёшь. · Когда начинается фильм? → Ты знаешь, когда начинается фильм?</span></div>

<div class="hack">
  <span class="lbl">Хак № 1 · вопрос в мешке</span>
  Засунь вопрос в мешок: вопросительное слово остаётся на входе, глагол проваливается на самое дно.
  <span class="big">wo · du · <u>wohnst</u></span>
  Порядок «вопросительное слово — подлежащее — … — глагол» не меняется никогда, какой бы ни была главная часть.
</div>

<div class="cut">
  Wann fängt der Film <span class="tail">an</span>? <span class="arrow">→</span> …, wann der Film <span class="tail">anfängt</span>
  <small>отделяемая приставка снова прилипает к глаголу</small>
</div>

<div class="flow">
  <div class="step"><div class="txt">Возьми прямой вопрос.<i>Wie viel kostet die Fahrkarte?</i></div></div>
  <div class="step"><div class="txt">Поставь запятую, вопросительное слово оставь.<i>Können Sie mir sagen, wie viel …</i></div></div>
  <div class="step"><div class="txt">Подлежащее сразу за ним, глагол — в конец. Знак вопроса только если вся фраза вопрос.<i>…, wie viel die Fahrkarte <span class="end">kostet</span>?</i></div></div>
</div>

<div class="note"><b>Это главная ошибка урока.</b> <span class="de">Ich weiß nicht, wo <b>wohnt er</b>.</span> — русский порядок «где живёт он» тянет глагол вперёд. Правильно: <span class="de">Ich weiß nicht, wo er <b>wohnt</b>.</span></div>
`
    },

    {
      title: "ob — вопрос без вопросительного слова",
      html: `
<p>Если в прямом вопросе нет вопросительного слова (ответ «да» или «нет»), при заворачивании нужно что-то поставить на пустое место. Это <span class="de">ob</span> — русское «ли».</p>

<div class="ex"><span class="de">Kommst du morgen? <b>→</b> Otto möchte wissen, <b>ob</b> du morgen <b>kommst</b>.<br>Hast du Zeit? <b>→</b> Ich frage dich, <b>ob</b> du Zeit <b>hast</b>.</span>
<span class="ru">Ты придёшь завтра? → Отто хочет знать, придёшь ли ты завтра. · Есть у тебя время? → Я спрашиваю, есть ли у тебя время.</span></div>

<div class="hack">
  <span class="lbl">Хак № 2 · пустое место — вставь ob</span>
  Спроси себя: в прямом вопросе было вопросительное слово?
  <span class="big">было (wo, wann, warum…) → оно и остаётся<br>не было (глагол первым) → ставь ob</span>
</div>

<div class="matrix" style="grid-template-columns: repeat(3, 1fr)">
  <div class="cell head">прямой вопрос</div><div class="cell head">заворачиваем</div><div class="cell head">что в начале</div>
  <div class="cell">Wo wohnst du?</div><div class="cell">…, wo du wohnst</div><div class="cell"><b>wo</b>остаётся</div>
  <div class="cell">Wohnst du hier?</div><div class="cell">…, ob du hier wohnst</div><div class="cell hl"><b>ob</b>вставляем</div>
</div>

<div class="hack">
  <span class="lbl">Хак № 3 · «ли» — это ob, а не wenn</span>
  Русское «ли» переводится только как <span class="de">ob</span>. <span class="de">wenn</span> — это «если» и «когда».
  <span class="de">Ich weiß nicht, <b>ob</b> er kommt.</span> — не знаю, придёт <b>ли</b> он.<br>
  <span class="de">Ich komme, <b>wenn</b> ich Zeit habe.</span> — приду, <b>если</b> будет время.
  <b>Главная ловушка:</b> «Ich weiß nicht, wenn er kommt» — так нельзя.
</div>
`
    },

    {
      title: "wenn — условие и «каждый раз, когда»",
      html: `
<p><span class="de">wenn</span> открывает придаточное условия или повторяющегося времени. Глагол, как во всех придаточных, в конце.</p>

<div class="ex"><span class="de">Ich bleibe zu Hause, <b>wenn</b> es <b>regnet</b>.<br>Man muss anhalten, <b>wenn</b> die Ampel rot <b>ist</b>.</span>
<span class="ru">Я остаюсь дома, если идёт дождь. · Надо остановиться, когда горит красный.</span></div>

<div class="hack">
  <span class="lbl">Хак № 4 · два глагола встречаются у запятой</span>
  Поставь <span class="de">wenn</span>-часть вперёд — и главное предложение начнётся прямо с глагола. Придаточное целиком занимает место № 1.
  <div class="rhyme">…, wenn der Wecker klingel<span>t</span>, <span>stehe</span> ich auf</div>
  <span class="big">Wenn der Wecker <u>klingelt</u>, <u>stehe</u> ich sofort auf.</span>
  Глагол — запятая — глагол. Если между запятой и глаголом влезло подлежащее, порядок сломан.
</div>

<div class="note"><b>Ловушка:</b> <span class="de">Wenn es regnet, <b>ich bleibe</b> zu Hause.</span> — неверно. Правильно: <span class="de">Wenn es regnet, <b>bleibe ich</b> zu Hause.</span></div>

<p class="muted">Для одного события в прошлом («когда я был маленьким») нужен не <span class="de">wenn</span>, а <span class="de">als</span> — это тема урока 25.</p>
`
    },

    {
      title: "Глаголы с постоянным предлогом",
      html: `
<p>Многие немецкие глаголы требуют своего предлога — и он часто не совпадает с русским. <span class="de">warten <b>auf</b></span> — ждать (кого-то), <span class="de">denken <b>an</b></span> — думать о, <span class="de">sich interessieren <b>für</b></span> — интересоваться чем-то.</p>

<div class="hack">
  <span class="lbl">Хак № 5 · учи глагол с предлогом одним словом</span>
  Не «warten — ждать», а <span class="de">warten-auf</span> как одно слово. Предлог — часть глагола, отдельно он не угадывается.
  <span class="big">warten auf · denken an · träumen von · bitten um</span>
</div>

<div class="scrollx">
<table class="tbl">
<tr><th>глагол</th><th>предлог</th><th>по-русски</th></tr>
<tr><td>warten</td><td>auf + A</td><td>ждать кого-то / что-то</td></tr>
<tr><td>sich freuen</td><td>auf + A</td><td>радоваться тому, что будет</td></tr>
<tr><td>sich freuen</td><td>über + A</td><td>радоваться тому, что есть</td></tr>
<tr><td>sich ärgern</td><td>über + A</td><td>злиться на</td></tr>
<tr><td>denken / sich erinnern</td><td>an + A</td><td>думать о / вспоминать</td></tr>
<tr><td>sich interessieren</td><td>für + A</td><td>интересоваться</td></tr>
<tr><td>bitten / sich Sorgen machen</td><td>um + A</td><td>просить о / беспокоиться о</td></tr>
<tr><td>träumen</td><td>von + D</td><td>мечтать о</td></tr>
<tr><td>sich verabschieden</td><td>von + D</td><td>прощаться с</td></tr>
<tr><td>sich streiten / sich unterhalten</td><td>mit + D</td><td>ссориться / беседовать с</td></tr>
<tr><td>sich entschuldigen</td><td>bei + D</td><td>извиняться перед</td></tr>
</table>
</div>

<div class="hack">
  <span class="lbl">Хак № 6 · freuen: вперёд — auf, вокруг — über</span>
  <span class="de">Ich freue mich <b>auf</b> die Ferien.</span> — каникулы ещё впереди, смотрю вперёд.<br>
  <span class="de">Ich freue mich <b>über</b> das Geschenk.</span> — подарок уже в руках, радуюсь тому, что есть.
</div>

<div class="note"><b>Ловушка:</b> «ждать автобус» по-русски без предлога, а по-немецки обязательно <span class="de">auf</span>: <span class="de">Ich warte <b>auf den</b> Bus.</span> Без предлога — ошибка.</div>
`
    },

    {
      title: "Падеж после предлога и вопросы worauf / an wen",
      html: `
<p>Падеж задаёт предлог, а не глагол. В этих связках почти всегда так:</p>

<div class="matrix" style="grid-template-columns: repeat(2, 1fr)">
  <div class="cell head">Akkusativ</div><div class="cell head">Dativ</div>
  <div class="cell"><b>auf · über · an · für · um</b>den / einen</div>
  <div class="cell hl"><b>mit · von · bei · vor</b>dem / einem</div>
</div>

<div class="hack">
  <span class="lbl">Хак № 7 · короткие дативные предлоги</span>
  <div class="rhyme"><span>mit</span> · <span>von</span> · <span>bei</span> — всегда Dativ</div>
  Всё остальное в этих глаголах — Akkusativ. <span class="de">Ich warte auf <b>den</b> Bus</span>, но <span class="de">ich träume von <b>dem</b> Urlaub</span>.
</div>

<h3>Как спросить: вещь или человек</h3>
<div class="cut">
  auf <span class="tail">den Bus</span> <span class="arrow">→</span> <span class="tail">wor</span>auf? <span class="arrow">→</span> <span class="tail">dar</span>auf
  <small>вещь: wo(r)- в вопросе, da(r)- в ответе</small>
  an <span class="tail">meine Freundin</span> <span class="arrow">→</span> an <span class="tail">wen</span>? <span class="arrow">→</span> an <span class="tail">sie</span>
  <small>человек: предлог + wen / wem, в ответе местоимение</small>
</div>

<div class="hack">
  <span class="lbl">Хак № 8 · r — прокладка между гласными</span>
  Если предлог начинается с гласной, между <span class="de">wo/da</span> и ним вставляется <b>r</b>: <span class="de">wo<b>r</b>auf, da<b>r</b>an, wo<b>r</b>über</span>. С согласной — без неё: <span class="de">wofür, dafür, wovon, davon, womit</span>.
</div>

<div class="ex"><span class="de">Worauf wartest du? — Auf den Bus. Ich warte schon lange darauf.<br>An wen denkst du? — An meine Freundin. Ich denke oft an sie.</span>
<span class="ru">Чего ты ждёшь? — Автобуса. Я его давно жду. · О ком ты думаешь? — О своей подруге. Я часто о ней думаю.</span></div>

<div class="note"><b>Ловушка:</b> <span class="de">Auf was wartest du?</span> — разговорно встречается, но в письменной речи и на экзамене только <span class="de">Worauf</span>. А про людей наоборот: <span class="de">Woran denkst du?</span> — о чём, <span class="de">An wen denkst du?</span> — о ком.</div>
`
    }
  ],

  days: [
    {
      title: "Косвенный вопрос с вопросительным словом",
      sub: "wie, wo, wann, warum, was — и глагол в конце",
      grammar: [0],
      ex: [
        { type: "choice",
          q: "Ich möchte wissen, wie spät ___ .",
          opts: ["es ist", "ist es", "es sein"], a: 0,
          ru: "Я хотел бы знать, который час.",
          why: "Вопросительное слово wie открывает придаточное: подлежащее es сразу за ним, глагол ist — в конце." },

        { type: "choice",
          q: "Weißt du, wo ___ ?",
          opts: ["der Bahnhof ist", "ist der Bahnhof", "der Bahnhof sein"], a: 0,
          ru: "Ты знаешь, где вокзал?",
          why: "Внутри вопроса Weißt du…? стоит придаточное с wo — там глагол в конце: wo der Bahnhof ist." },

        { type: "fill",
          q: "Auf dem Fahrplan steht, um wie viel Uhr der Zug {abfahren}.",
          a: ["abfährt"],
          ru: "В расписании написано, во сколько отправляется поезд.",
          why: "В конце придаточного отделяемая приставка снова прилипает к глаголу: der Zug fährt ab → …, wann der Zug abfährt." },

        { type: "fill",
          q: "Die nette Frau zeigt mir, wo ich eine Fahrkarte kaufen {können}.",
          a: ["kann"],
          ru: "Милая женщина показывает мне, где я могу купить билет.",
          why: "Модальный глагол — спрягаемый, он и уходит в самый конец, после инфинитива: kaufen kann." },

        { type: "fill",
          q: "Der Mann am Schalter sagt mir, wie viel eine Fahrkarte {kosten}.",
          a: ["kostet"],
          ru: "Мужчина в кассе говорит мне, сколько стоит билет.",
          why: "eine Fahrkarte — третье лицо единственного числа: kostet, и в конец." },

        { type: "choice",
          q: "Ich habe nicht verstanden, was der Mann ___ .",
          opts: ["gesagt hat", "hat gesagt", "sagt hat"], a: 0,
          ru: "Я не понял, что сказал мужчина.",
          why: "Perfekt в придаточном: причастие gesagt перед спрягаемым hat, hat — самое последнее." },

        { type: "fill",
          q: "Der Schüler fragt immer, warum er so viele Hausaufgaben machen {müssen}.",
          a: ["muss"],
          ru: "Ученик всё время спрашивает, почему ему надо делать так много домашних заданий.",
          why: "er muss — спрягаемая форма, она стоит последней, после инфинитива machen." },

        { type: "choice",
          q: "Vorn auf dem Bus steht meistens, ___ er fährt.",
          opts: ["wohin", "wo", "woher"], a: 0,
          ru: "Спереди на автобусе обычно написано, куда он едет.",
          why: "Направление движения — wohin, «куда». wo — «где», woher — «откуда»." },

        { type: "fill",
          q: "Ich weiß nicht, {} er wohnt.",
          a: ["wo"],
          ru: "Я не знаю, где он живёт.",
          why: "Место — wo. Глагол wohnt уже стоит в конце, как положено в придаточном." },

        { type: "choice",
          q: "Kannst du mir sagen, wann ___ ?",
          opts: ["der Film anfängt", "fängt der Film an", "der Film fängt an"], a: 0,
          ru: "Можешь сказать мне, когда начинается фильм?",
          why: "Придаточное с wann: глагол в конце, приставка an возвращается к глаголу — anfängt." },

        { type: "fill",
          q: "Weißt du, wann der Unterricht {beginnen}?",
          a: ["beginnt"],
          ru: "Ты знаешь, когда начинается урок?",
          why: "der Unterricht — он: beginnt, в конце придаточного." },

        { type: "pairs",
          prompt: "Соедини вопросительное слово с переводом.",
          pairs: [["wie", "как"], ["wo", "где"], ["wohin", "куда"], ["woher", "откуда"], ["wann", "когда"], ["warum", "почему"]] },

        { type: "choice",
          q: "Er fragt, wo ___ .",
          opts: ["ich wohne", "wohne ich", "ich wohnen"], a: 0,
          ru: "Он спрашивает, где я живу.",
          why: "Главная ошибка урока: русский порядок «где живу я» тянет глагол вперёд. В придаточном — wo ich wohne." },

        { type: "translate",
          ru: "Я не знаю, где он живёт.",
          a: ["Ich weiß nicht, wo er wohnt."],
          why: "wo открывает придаточное, wohnt — в конец." },

        { type: "translate",
          ru: "Скажи мне, когда начинается фильм.",
          a: ["Sag mir, wann der Film anfängt.", "Sag mir, wann der Film beginnt.", "Sage mir, wann der Film anfängt."],
          why: "anfangen отделяемый, но в придаточном он снова целый: wann der Film anfängt." },

        { type: "translate",
          ru: "Вы можете сказать мне, сколько стоит билет?",
          a: ["Können Sie mir sagen, wie viel die Fahrkarte kostet?", "Können Sie mir sagen, was die Fahrkarte kostet?", "Können Sie mir sagen, wie viel das Ticket kostet?", "Können Sie mir sagen, was das Ticket kostet?"],
          why: "Вежливый вопрос — сам по себе вопрос, поэтому в конце знак вопроса, но внутри придаточное: kostet в конце." }
      ]
    },

    {
      title: "ob: вопрос, на который отвечают «да» или «нет»",
      sub: "ob вместо пустого места, ob против wenn",
      grammar: [1, 0],
      ex: [
        { type: "choice",
          q: "Otto möchte wissen, ___ ich morgen komme.",
          opts: ["ob", "wenn", "dass"], a: 0,
          ru: "Отто хочет знать, приду ли я завтра.",
          why: "Прямой вопрос «Kommst du morgen?» без вопросительного слова — значит ob, русское «ли»." },

        { type: "choice",
          q: "Ich frage die Frau, ___ sie morgen Zeit hat.",
          opts: ["ob", "wenn", "dass"], a: 0,
          ru: "Я спрашиваю женщину, есть ли у неё завтра время.",
          why: "«Haben Sie morgen Zeit?» — вопрос «да или нет», его заворачивают через ob." },

        { type: "fill",
          q: "Der Lehrer fragt die Schüler, ob sie fertig {sein}.",
          a: ["sind"],
          ru: "Учитель спрашивает учеников, готовы ли они.",
          why: "sie (они) sind, и спрягаемый глагол — в конец придаточного." },

        { type: "fill",
          q: "Die Schüler möchten wissen, ob der Lehrer den Test schon kontrolliert {haben}.",
          a: ["hat"],
          ru: "Ученики хотят знать, проверил ли учитель тест.",
          why: "Perfekt: kontrolliert + hat, спрягаемое hat — самое последнее." },

        { type: "choice",
          q: "«Woher kommen Sie?» — Der Mann möchte wissen, ___ ich komme.",
          opts: ["woher", "ob", "wo"], a: 0,
          ru: "«Откуда вы?» — Мужчина хочет знать, откуда я.",
          why: "В прямом вопросе было вопросительное слово woher — оно и остаётся. ob нужен, только когда слова не было." },

        { type: "fill",
          q: "Ich möchte wissen, {} dir die Stadt gefällt.",
          a: ["ob"],
          ru: "Я хотел бы знать, нравится ли тебе город.",
          why: "«Gefällt dir die Stadt?» — вопрос «да/нет», поэтому ob." },

        { type: "fill",
          q: "Die Reporterin möchte wissen, wie alt der Junge {sein}.",
          a: ["ist"],
          ru: "Репортёрша хочет знать, сколько лет мальчику.",
          why: "der Junge ist, и в конец." },

        { type: "choice",
          q: "Die Reporterin fragt, ___ er ein Handy hat.",
          opts: ["ob", "was", "wenn"], a: 0,
          ru: "Репортёрша спрашивает, есть ли у него телефон.",
          why: "«Hast du ein Handy?» — да или нет, значит ob." },

        { type: "fill",
          q: "Sie will wissen, wann er zu Hause sein {müssen}.",
          a: ["muss"],
          ru: "Она хочет знать, когда он должен быть дома.",
          why: "er muss — спрягаемое, после инфинитива sein, в самом конце." },

        { type: "choice",
          q: "Ich weiß nicht, ___ er heute kommt.",
          opts: ["ob", "wenn"], a: 0,
          ru: "Я не знаю, придёт ли он сегодня.",
          why: "Русское «ли» — только ob. wenn значит «если» или «когда», здесь смысл другой." },

        { type: "fill",
          q: "Frag ihn, ob er mitkommen {wollen}.",
          a: ["will"],
          ru: "Спроси его, хочет ли он пойти с нами.",
          why: "er will — неправильная форма модального глагола, и она в конце: mitkommen will." },

        { type: "choice",
          q: "Weißt du, ob ___ ?",
          opts: ["sie schon angekommen ist", "ist sie schon angekommen", "sie ist schon angekommen"], a: 0,
          ru: "Ты знаешь, приехала ли она уже?",
          why: "После ob всё как в придаточном: angekommen ist в конце." },

        { type: "pairs",
          prompt: "Соедини прямой вопрос с косвенным.",
          pairs: [["Kommst du?", "ob du kommst"], ["Wo wohnst du?", "wo du wohnst"], ["Hast du Zeit?", "ob du Zeit hast"], ["Wann kommst du?", "wann du kommst"], ["Was machst du?", "was du machst"], ["Bist du müde?", "ob du müde bist"]] },

        { type: "translate",
          ru: "Я не знаю, придёт ли он.",
          a: ["Ich weiß nicht, ob er kommt."],
          why: "«ли» → ob, глагол kommt в конце." },

        { type: "translate",
          ru: "Спроси её, есть ли у неё время.",
          a: ["Frag sie, ob sie Zeit hat.", "Frage sie, ob sie Zeit hat."],
          why: "Вопрос «да/нет» заворачивается через ob, hat — в конец." },

        { type: "translate",
          ru: "Он хочет знать, сколько тебе лет.",
          a: ["Er möchte wissen, wie alt du bist.", "Er will wissen, wie alt du bist."],
          why: "Вопросительное слово wie alt остаётся, bist уходит в конец." }
      ]
    },

    {
      title: "wenn: условие и «каждый раз, когда»",
      sub: "wenn-часть впереди: глагол — запятая — глагол",
      grammar: [2],
      ex: [
        { type: "choice",
          q: "___ es regnet, bleibe ich zu Hause.",
          opts: ["Wenn", "Ob", "Dass"], a: 0,
          ru: "Если идёт дождь, я остаюсь дома.",
          why: "Условие — wenn. ob — «ли», dass — «что»." },

        { type: "choice",
          q: "Wenn der Wecker klingelt, ___ .",
          opts: ["stehe ich sofort auf", "ich stehe sofort auf", "ich sofort aufstehe"], a: 0,
          ru: "Когда звонит будильник, я сразу встаю.",
          why: "Придаточное занимает место № 1, поэтому главная часть начинается с глагола: stehe ich." },

        { type: "fill",
          q: "Man muss anhalten, wenn die Ampel rot {sein}.",
          a: ["ist"],
          ru: "Надо остановиться, когда горит красный свет.",
          why: "die Ampel ist, и в конец придаточного." },

        { type: "fill",
          q: "Wenn es zur Pause {klingeln}, stehen die Schüler auf.",
          a: ["klingelt"],
          ru: "Когда звенит звонок на перемену, ученики встают.",
          why: "es klingelt — в конце придаточного, сразу за запятой начинается главная часть с глагола stehen." },

        { type: "choice",
          q: "Wenn die anderen Schüler draußen sind, ___ .",
          opts: ["kann der Lehrer in Ruhe sprechen", "der Lehrer kann in Ruhe sprechen", "der Lehrer in Ruhe sprechen kann"], a: 0,
          ru: "Когда остальные ученики на улице, учитель может спокойно поговорить.",
          why: "Глагол — запятая — глагол: sind, kann. Подлежащее der Lehrer идёт после глагола." },

        { type: "fill",
          q: "Wenn der Unterricht zu Ende ist, {putzen} ein Schüler die Tafel.",
          a: ["putzt"],
          ru: "Когда урок заканчивается, один ученик вытирает доску.",
          why: "ein Schüler — он: putzt. Стоит сразу после запятой, потому что место № 1 заняла wenn-часть." },

        { type: "fill",
          q: "Wenn ein Schüler zur Toilette gehen {möchten}, fragt er den Lehrer.",
          a: ["möchte"],
          ru: "Если ученик хочет в туалет, он спрашивает учителя.",
          why: "er möchte — в конце придаточного, после инфинитива gehen." },

        { type: "choice",
          q: "Was machst du, wenn es ___ ?",
          opts: ["brennt", "brennen", "gebrannt"], a: 0,
          ru: "Что ты делаешь, если начинается пожар?",
          why: "es brennt — третье лицо, настоящее время, в конце придаточного." },

        { type: "fill",
          q: "Wenn es brennt, rufe ich sofort die Feuerwehr {}.",
          a: ["an"],
          ru: "Если пожар, я сразу звоню пожарным.",
          why: "В главной части anrufen разваливается: rufe … an. Приставка уходит в конец главного предложения." },

        { type: "choice",
          q: "Ich weiß nicht, ___ ich morgen Zeit habe.",
          opts: ["ob", "wenn"], a: 0,
          ru: "Я не знаю, будет ли у меня завтра время.",
          why: "«будет ли» — это «ли», значит ob. Главная ловушка между wenn и ob." },

        { type: "fill",
          q: "Die Freunde wollen in die Stadt gehen, wenn sie mit den Hausaufgaben fertig {sein}.",
          a: ["sind"],
          ru: "Друзья хотят пойти в город, когда закончат с домашним заданием.",
          why: "sie sind — в конце придаточного." },

        { type: "choice",
          q: "Wenn du Hunger hast, ___ etwas!",
          opts: ["iss", "du isst", "isst du"], a: 0,
          ru: "Если ты голоден, поешь что-нибудь!",
          why: "Главная часть — повеление: iss! После wenn-части повелительная форма тоже стоит сразу за запятой." },

        { type: "pairs",
          prompt: "Соедини условие с тем, что из него следует.",
          pairs: [["Wenn es regnet,", "nehme ich einen Schirm."], ["Wenn ich müde bin,", "gehe ich ins Bett."], ["Wenn ich Hunger habe,", "esse ich etwas."], ["Wenn es kalt ist,", "ziehe ich eine Jacke an."], ["Wenn der Bus nicht kommt,", "gehe ich zu Fuß."], ["Wenn ich krank bin,", "bleibe ich zu Hause."]] },

        { type: "translate",
          ru: "Если идёт дождь, я остаюсь дома.",
          a: ["Wenn es regnet, bleibe ich zu Hause.", "Wenn es regnet, bleibe ich daheim."],
          why: "Глагол — запятая — глагол: regnet, bleibe." },

        { type: "translate",
          ru: "Когда звонит будильник, я сразу встаю.",
          a: ["Wenn der Wecker klingelt, stehe ich sofort auf."],
          why: "wenn-часть на месте № 1, главная начинается с stehe, приставка auf — в конце." },

        { type: "translate",
          ru: "Позвони мне, если у тебя будет время.",
          a: ["Ruf mich an, wenn du Zeit hast.", "Rufe mich an, wenn du Zeit hast."],
          why: "Условие в будущем по-немецки передаётся настоящим временем: wenn du Zeit hast." }
      ]
    },

    {
      title: "dass, weil, wenn, ob — все вместе в тексте",
      sub: "Willi, супермаркет, отец и сын: выбери союз по смыслу",
      grammar: [0, 1, 2],
      ex: [
        { type: "choice",
          q: "Die Lehrerin schimpft mit Willi, ___ er frech gewesen ist.",
          opts: ["weil", "dass", "ob"], a: 0,
          ru: "Учительница ругает Вилли, потому что он дерзил.",
          why: "Причина — weil." },

        { type: "choice",
          q: "Er hat gesagt, ___ die Lehrerin eine Hexe ist.",
          opts: ["dass", "weil", "ob"], a: 0,
          ru: "Он сказал, что учительница — ведьма.",
          why: "Пересказ содержания после sagen — dass, «что»." },

        { type: "choice",
          q: "Sie weiß nicht, ___ er das auch direkt zu ihr sagt.",
          opts: ["ob", "dass", "wenn"], a: 0,
          ru: "Она не знает, скажет ли он это ей в лицо.",
          why: "«скажет ли» — «ли», значит ob." },

        { type: "fill",
          q: "Willi wiederholt es nicht, {} er Angst vor einer Strafe hat.",
          a: ["weil"],
          ru: "Вилли этого не повторяет, потому что боится наказания.",
          why: "Причина — weil, глагол hat стоит в конце." },

        { type: "fill",
          q: "Im Supermarkt muss der Kunde selbst wählen, {} es meistens keine Verkäufer gibt.",
          a: ["weil"],
          ru: "В супермаркете покупатель должен выбирать сам, потому что продавцов обычно нет.",
          why: "Объяснение причины — weil." },

        { type: "fill",
          q: "Viele Kunden wissen nicht genau, {} sie einkaufen wollen.",
          a: ["was"],
          ru: "Многие покупатели точно не знают, что хотят купить.",
          why: "Прямой вопрос «Was wollen wir einkaufen?» — вопросительное слово was остаётся." },

        { type: "choice",
          q: "Jeder weiß, ___ Musik gute Laune macht.",
          opts: ["dass", "ob", "wenn"], a: 0,
          ru: "Все знают, что музыка поднимает настроение.",
          why: "После wissen пересказывается факт — dass." },

        { type: "fill",
          q: "Die teuren Waren liegen in Augenhöhe, weil der Kunde zuerst dahin {schauen}.",
          a: ["schaut"],
          ru: "Дорогие товары лежат на уровне глаз, потому что покупатель сначала смотрит туда.",
          why: "der Kunde schaut — в конец придаточного с weil." },

        { type: "fill",
          q: "Der Vater kann nicht anfangen zu essen, {} der Sohn noch nicht da ist.",
          a: ["weil"],
          ru: "Отец не может начать есть, потому что сына ещё нет.",
          why: "Причина — weil." },

        { type: "choice",
          q: "Die Mutter möchte wissen, ___ der Vater nicht kommt.",
          opts: ["warum", "dass", "wenn"], a: 0,
          ru: "Мама хочет знать, почему отец не идёт.",
          why: "Вопрос о причине — warum, он же открывает придаточное." },

        { type: "fill",
          q: "Der Sohn sieht, {} sein Vater auf dem Fußboden liegt.",
          a: ["dass"],
          ru: "Сын видит, что его отец лежит на полу.",
          why: "Содержание увиденного — dass." },

        { type: "choice",
          q: "Er fragt den Vater, ___ ihm das Buch gefällt.",
          opts: ["ob", "dass", "wenn"], a: 0,
          ru: "Он спрашивает отца, нравится ли ему книга.",
          why: "«нравится ли» — ob." },

        { type: "fill",
          q: "Die Polizei glaubt, dass der junge Mann das Auto gestohlen {haben}.",
          a: ["hat"],
          ru: "Полиция думает, что молодой человек угнал машину.",
          why: "Perfekt: gestohlen hat, hat — последним." },

        { type: "translate",
          ru: "Я знаю, что он прав.",
          a: ["Ich weiß, dass er recht hat.", "Ich weiß, dass er Recht hat."],
          why: "Recht haben — «быть правым», hat в конце придаточного с dass." },

        { type: "translate",
          ru: "Мы не знаем, почему он не пришёл.",
          a: ["Wir wissen nicht, warum er nicht gekommen ist.", "Wir wissen nicht, warum er nicht kam."],
          why: "warum открывает придаточное, Perfekt gekommen ist — в конце." },

        { type: "translate",
          ru: "Я надеюсь, что ты скоро придёшь.",
          a: ["Ich hoffe, dass du bald kommst."],
          why: "После hoffen — dass, будущее передаётся настоящим: du kommst." }
      ]
    },

    {
      title: "Глаголы с предлогом: какой предлог",
      sub: "warten auf, denken an, träumen von — учим парами",
      grammar: [3],
      ex: [
        { type: "choice",
          q: "Ich warte ___ meinen Freund.",
          opts: ["auf", "für", "an"], a: 0,
          ru: "Я жду своего друга.",
          why: "warten auf — постоянная пара. По-русски предлога нет, по-немецки он обязателен." },

        { type: "choice",
          q: "Anna denkt immer ___ ihren Freund.",
          opts: ["an", "über", "auf"], a: 0,
          ru: "Анна всё время думает о своём друге.",
          why: "denken an — «думать о». über здесь был бы «рассуждать о»." },

        { type: "choice",
          q: "Ich interessiere mich nicht ___ Musik.",
          opts: ["für", "über", "an"], a: 0,
          ru: "Я не интересуюсь музыкой.",
          why: "sich interessieren für — «интересоваться чем-то»." },

        { type: "fill",
          q: "Der Lehrer ärgert sich {} seine Schüler.",
          a: ["über"],
          ru: "Учитель злится на своих учеников.",
          why: "sich ärgern über — «злиться на»." },

        { type: "fill",
          q: "Wir machen uns Sorgen {} unsere Kinder.",
          a: ["um"],
          ru: "Мы беспокоимся о наших детях.",
          why: "sich Sorgen machen um — «беспокоиться о»." },

        { type: "fill",
          q: "Peter streitet sich {} seiner Schwester.",
          a: ["mit"],
          ru: "Петер ссорится со своей сестрой.",
          why: "sich streiten mit — «ссориться с». Отсюда и Dativ: seiner." },

        { type: "choice",
          q: "Anna verabschiedet sich ___ ihrer Freundin.",
          opts: ["von", "mit", "bei"], a: 0,
          ru: "Анна прощается со своей подругой.",
          why: "sich verabschieden von — «прощаться с». Русское «с» подталкивает к mit, но это ловушка." },

        { type: "fill",
          q: "Ich entschuldige mich {} meinem Lehrer.",
          a: ["bei"],
          ru: "Я извиняюсь перед учителем.",
          why: "sich entschuldigen bei — «извиняться перед кем-то»." },

        { type: "fill",
          q: "Ich erinnere mich gern {} meine Kindheit.",
          a: ["an"],
          ru: "Я с удовольствием вспоминаю своё детство.",
          why: "sich erinnern an — «вспоминать»." },

        { type: "choice",
          q: "Morgen beginnen die Ferien. Ich freue mich ___ die Ferien.",
          opts: ["auf", "über", "für"], a: 0,
          ru: "Завтра начинаются каникулы. Я жду каникул с радостью.",
          why: "Каникулы ещё впереди — auf. über было бы, если бы они уже шли." },

        { type: "fill",
          q: "Danke {} das Geschenk!",
          a: ["für"],
          ru: "Спасибо за подарок!",
          why: "danken für — «благодарить за»." },

        { type: "choice",
          q: "Ich bitte dich ___ Hilfe.",
          opts: ["um", "für", "nach"], a: 0,
          ru: "Я прошу тебя о помощи.",
          why: "bitten um — «просить о». für — частая ошибка из-за английского «ask for»." },

        { type: "fill",
          q: "Alle Menschen träumen {} einem Leben ohne Krieg.",
          a: ["von"],
          ru: "Все люди мечтают о жизни без войны.",
          why: "träumen von — «мечтать о»." },

        { type: "pairs",
          prompt: "Соедини глагол с его предлогом.",
          pairs: [["warten", "auf"], ["denken", "an"], ["träumen", "von"], ["sich interessieren", "für"], ["bitten", "um"], ["sich streiten", "mit"]] },

        { type: "translate",
          ru: "Я жду автобус.",
          a: ["Ich warte auf den Bus."],
          why: "warten auf + Akkusativ: auf den Bus." },

        { type: "translate",
          ru: "Он интересуется футболом.",
          a: ["Er interessiert sich für Fußball.", "Er interessiert sich für den Fußball."],
          why: "sich interessieren für — возвратный глагол, sich обязателен." }
      ]
    },

    {
      title: "Падеж после предлога и вопросы worauf / an wen",
      sub: "Akkusativ или Dativ, вещь или человек",
      grammar: [4, 3],
      ex: [
        { type: "choice",
          q: "Ich warte auf ___ Bus.",
          opts: ["den", "dem", "der"], a: 0,
          ru: "Я жду автобус.",
          why: "auf в этих глаголах — Akkusativ: den Bus." },

        { type: "choice",
          q: "Ich träume von ___ Urlaub am Meer.",
          opts: ["einem", "einen", "ein"], a: 0,
          ru: "Я мечтаю об отпуске на море.",
          why: "von — всегда Dativ: einem Urlaub." },

        { type: "choice",
          q: "Er denkt oft an ___ Freundin.",
          opts: ["seine", "seiner", "seinem"], a: 0,
          ru: "Он часто думает о своей подруге.",
          why: "an в denken an — Akkusativ, женский род: seine." },

        { type: "fill",
          q: "Ich ärgere mich über {d} Lärm in der Klasse.",
          a: ["den"],
          ru: "Я злюсь на шум в классе.",
          why: "über + Akkusativ, der Lärm мужского рода → den." },

        { type: "fill",
          q: "Sie streitet sich oft mit {ihr} Bruder.",
          a: ["ihrem"],
          ru: "Она часто ссорится со своим братом.",
          why: "mit — всегда Dativ, der Bruder → ihrem." },

        { type: "fill",
          q: "Wir freuen uns auf {ein} schönes Wochenende.",
          a: ["ein"],
          ru: "Мы с нетерпением ждём хороших выходных.",
          why: "auf + Akkusativ, das Wochenende среднего рода — ein без окончания, поле остаётся пустым." },

        { type: "choice",
          q: "___ wartest du? — Auf den Bus.",
          opts: ["Worauf", "Auf was", "Wofür"], a: 0,
          ru: "Чего ты ждёшь? — Автобуса.",
          why: "Про вещь: wo + auf, с прокладкой r — worauf. «Auf was» — только разговорно." },

        { type: "choice",
          q: "___ denkst du? — An meine Freundin.",
          opts: ["An wen", "Woran", "Wovon"], a: 0,
          ru: "О ком ты думаешь? — О своей подруге.",
          why: "Про человека wo(r)- не работает: предлог + wen." },

        { type: "fill",
          q: "{} interessierst du dich? — Für Sport.",
          a: ["Wofür"],
          ru: "Чем ты интересуешься? — Спортом.",
          why: "Вещь, предлог für начинается с согласной — без r: wofür." },

        { type: "fill",
          q: "Hast du auf den Brief gewartet? — Ja, ich warte schon lange {}.",
          a: ["darauf"],
          ru: "Ты ждал письма? — Да, я его уже давно жду.",
          why: "В ответе вещь заменяется da(r)- + предлог: darauf." },

        { type: "choice",
          q: "Erinnerst du dich an den Urlaub? — Ja, ich erinnere mich gern ___ .",
          opts: ["daran", "an ihn", "woran"], a: 0,
          ru: "Ты помнишь отпуск? — Да, я с удовольствием его вспоминаю.",
          why: "Отпуск — вещь: daran." },

        { type: "choice",
          q: "Erinnerst du dich an Herrn Weiß? — Ja, ich erinnere mich gut ___ .",
          opts: ["an ihn", "daran", "woran"], a: 0,
          ru: "Ты помнишь господина Вайса? — Да, я хорошо его помню.",
          why: "Человек: предлог + местоимение, an ihn. daran про людей не говорят." },

        { type: "fill",
          q: "{} träumst du? — Von einem neuen Fahrrad.",
          a: ["Wovon"],
          ru: "О чём ты мечтаешь? — О новом велосипеде.",
          why: "Вещь, von начинается с согласной: wovon." },

        { type: "translate",
          ru: "О чём ты думаешь?",
          a: ["Woran denkst du?"],
          why: "denken an, про вещь: wo + r + an." },

        { type: "translate",
          ru: "Я с нетерпением жду выходных.",
          a: ["Ich freue mich auf das Wochenende.", "Ich freue mich aufs Wochenende."],
          why: "Выходные впереди — sich freuen auf + Akkusativ." },

        { type: "translate",
          ru: "Она извиняется перед учителем.",
          a: ["Sie entschuldigt sich bei dem Lehrer.", "Sie entschuldigt sich beim Lehrer.", "Sie entschuldigt sich bei ihrem Lehrer."],
          why: "sich entschuldigen bei + Dativ: beim Lehrer." }
      ]
    }
  ],

  /* 10 слов урока для карточек: глаголы с предлогом из упражнений lehrerlenz к Lektion 20. */
  words: [
    { de: "sich ärgern über", ru: "злиться на", ex: "Der Lehrer ärgert sich über den Lärm.", exru: "Учитель злится на шум." },
    { de: "sich freuen auf", ru: "радоваться (тому, что будет)", ex: "Ich freue mich auf die Ferien.", exru: "Я с нетерпением жду каникул." },
    { de: "sich erinnern an", ru: "вспоминать", ex: "Ich erinnere mich gern an meine Kindheit.", exru: "Я с удовольствием вспоминаю детство." },
    { de: "sich interessieren für", ru: "интересоваться", ex: "Sie interessiert sich für Fußball.", exru: "Она интересуется футболом." },
    { de: "sich entschuldigen bei", ru: "извиняться перед", ex: "Ich entschuldige mich bei meinem Lehrer.", exru: "Я извиняюсь перед учителем." },
    { de: "sich verabschieden von", ru: "прощаться с", ex: "Anna verabschiedet sich von ihrer Freundin.", exru: "Анна прощается с подругой." },
    { de: "warten auf", ru: "ждать", ex: "Wir warten auf den Bus.", exru: "Мы ждём автобус." },
    { de: "träumen von", ru: "мечтать о", ex: "Er träumt von einem eigenen Haus.", exru: "Он мечтает о собственном доме." },
    { de: "sich streiten mit", ru: "ссориться с", ex: "Peter streitet sich oft mit seiner Schwester.", exru: "Петер часто ссорится с сестрой." },
    { de: "bitten um", ru: "просить о", ex: "Darf ich Sie um Hilfe bitten?", exru: "Можно попросить вас о помощи?" }
  ],

  links: [
    { t: "Grammatik: Einführung (Genially)", url: "https://view.genially.com/6a412627b89ffa38d36624d0" },
    { t: "Grammatik: Regeln und Übungen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=373" },
    { t: "Willi, der freche Schüler", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=370" },
    { t: "im Unterricht", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=374" },
    { t: "die Zeitung berichtet", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=372" },
    { t: "ein Interview (eine Reporterin fragt einen Schüler)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=367" },
    { t: "Bildergeschichte: Vater und Sohn", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=376" },
    { t: "im Supermarkt", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=368" },
    { t: "Was machst du, wenn es brennt?", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=377" },
    { t: "Grammatik: Verben + Präpositionen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=375" },
    { t: "Verben + Präpositionen: kleiner Test", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=369" },
    { t: "Verben + Präposition: Fragen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=384" },
    { t: "Verben + Präposition: Antworten", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=385" }
  ]
};
