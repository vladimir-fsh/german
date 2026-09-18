/* Lektion 18 — Adjektivdeklination.
   Источник тем и лексики: lehrerlenz.de/lektion_18_adjektivdeklination.html */
window.L18 = {
  n: 18,
  title: "Adjektivdeklination",
  ru: "Склонение прилагательных: окончания перед существительным",

  grammar: [
    {
      title: "Когда у прилагательного появляется окончание",
      html: `
<p>У прилагательного два положения в предложении, и от этого зависит всё.</p>

<h3>1. После глагола — окончания нет никогда</h3>
<p>Прилагательное стоит после <span class="de">sein, werden, bleiben</span> или относится к глаголу как наречие. Форма всегда голая, словарная.</p>
<div class="ex"><span class="de">Das Wetter ist <b>gut</b>. · Es geht mir <b>gut</b>. · Ich habe <b>gut</b> geschlafen. · Es wird alles wieder <b>gut</b>.</span>
<span class="ru">Погода хорошая. · У меня всё хорошо. · Я хорошо спал. · Всё снова будет хорошо.</span></div>

<h3>2. Перед существительным — окончание обязательно</h3>
<div class="ex"><span class="de">Ich habe einen <b>guten</b> Test geschrieben. · Herr Rot ist ein <b>guter</b> Lehrer. · Ich liebe das <b>gute</b> Wetter.</span>
<span class="ru">Я написал хороший тест. · Господин Рот — хороший учитель. · Я люблю хорошую погоду.</span></div>

<div class="hack">
  <span class="lbl">Хак № 1 · тест на бутерброд</span>
  Прилагательное зажато между артиклем и существительным, как котлета в булке?
  <span class="big">ein · <u>gut__</u> · Lehrer → окончание есть</span>
  Стоит после глагола, справа ничего нет? <b>Голая форма, всегда.</b>
</div>

<h3>Почему окончания вообще нужны</h3>
<p>Немецкому нужен <b>сигнал</b> — маркер рода и падежа. Обычно сигналит артикль: <code>der</code>, <code>dem</code>, <code>einen</code>. Но артикль не всегда может: <span class="de">ein</span> одинаков для мужского и среднего рода. Тогда сигналит прилагательное.</p>

<div class="hack">
  <span class="lbl">Хак № 2 · правило одного сигнала</span>
  В связке «артикль + прилагательное» сигнал рода звучит <b>ровно один раз</b>.
  <span class="big">Артикль сказал → прилагательное молчит (-e / -en)<br>Артикль промолчал → прилагательное говорит (-er / -es)</span>
  Это единственное правило, из которого выводятся все три таблицы склонения. Запомни его — таблицы потом соберутся сами.
</div>

<div class="flow">
  <div class="step"><div class="txt">Прилагательное прямо перед существительным?<i>Нет → пиши словарную форму, дальше не думай.</i></div></div>
  <div class="step"><div class="txt">Посмотри на артикль: у него есть окончание-сигнал?<i>der, das, die, den, dem, eine, einen — сигнал есть. ein — сигнала нет.</i></div></div>
  <div class="step"><div class="txt">Сигнала нет → прилагательное берёт хвост артикля <span class="end">-er</span> / <span class="end">-es</span>.<i>Сигнал есть → слабое окончание <span class="end">-e</span> или <span class="end">-en</span>.</i></div></div>
</div>
`
    },
    {
      title: "ein / eine + прилагательное (Nominativ, Akkusativ)",
      html: `
<p>Группа <b>ein-Wörter</b>: <span class="de">ein, eine, kein, keine</span> и все притяжательные — <span class="de">mein, dein, sein, ihr, unser, euer</span>. Склоняются одинаково.</p>

<div class="hack">
  <span class="lbl">Хак № 3 · отрежь хвост у артикля</span>
  Не помнишь окончание? Возьми <i>определённый</i> артикль, отрежь последнюю букву и прилепи её к прилагательному.
  <div class="cut">
    de<span class="tail">R</span> Mann <span class="arrow">→</span> ein gute<span class="tail">r</span> Mann
    <small>der → -r</small>
    da<span class="tail">S</span> Kind <span class="arrow">→</span> ein gute<span class="tail">s</span> Kind
    <small>das → -s</small>
  </div>
  Работает всегда, когда артикль — голое <span class="de">ein / kein / mein</span>. Женский род и множественное в этом хаке не нуждаются: у <span class="de">eine</span> сигнал уже есть.
</div>

<div class="scrollx">
<table class="tbl">
<tr><th></th><th>маскулинум (der)</th><th>нейтрум (das)</th><th>фемининум (die)</th><th>плюраль (die)</th></tr>
<tr><th>Nominativ<br><span class="muted">кто? что?</span></th>
  <td class="m">ein gut<span class="end">er</span> Mann</td>
  <td class="n">ein gut<span class="end">es</span> Kind</td>
  <td class="f">eine gut<span class="end">e</span> Frau</td>
  <td class="p">meine gut<span class="end">en</span> Freunde</td></tr>
<tr><th>Akkusativ<br><span class="muted">кого? что?</span></th>
  <td class="m">einen gut<span class="end">en</span> Mann</td>
  <td class="n">ein gut<span class="end">es</span> Kind</td>
  <td class="f">eine gut<span class="end">e</span> Frau</td>
  <td class="p">meine gut<span class="end">en</span> Freunde</td></tr>
</table>
</div>

<h3>Вся таблица одной картинкой</h3>
<div class="matrix">
  <div class="cell head">der</div><div class="cell head">das</div><div class="cell head">die</div><div class="cell head">Plural</div>
  <div class="cell m"><b>-er</b>Nom.</div>
  <div class="cell n"><b>-es</b>Nom. + Akk.</div>
  <div class="cell f"><b>-e</b>Nom. + Akk.</div>
  <div class="cell p"><b>-en</b>всегда</div>
  <div class="cell m hl"><b>-en</b>Akk.</div>
  <div class="cell n">то же</div>
  <div class="cell f">то же</div>
  <div class="cell p">то же</div>
</div>
<p class="muted">Из восьми клеток по-настоящему подвижна одна — подсвеченная. Женский и средний род в Akkusativ не меняются вообще.</p>

<div class="hack">
  <span class="lbl">Хак № 4 · мужчина в аккузативе тонет в «-n»</span>
  <div class="rhyme">de<span>n</span> · eine<span>n</span> · gute<span>n</span> Mann</div>
  Все три слова кончаются на <b>-n</b>. Если в предложении есть мужской род и вопрос «кого? что?» — ставь <span class="end">-n</span> везде, где можно. Это ловушка №1 всего урока.
</div>

<div class="hack">
  <span class="lbl">Хак № 5 · связка с глаголом</span>
  Падеж задаёт глагол, а не прилагательное:
  <span class="big">sein → Nominativ · haben, brauchen, kaufen, tragen, sehen → Akkusativ</span>
  <span class="de">Er <b>ist</b> ein gut<span class="end">er</span> Lehrer.</span> ↔ <span class="de">Er <b>hat</b> ein<span class="end">en</span> gut<span class="end">en</span> Lehrer.</span>
</div>

<h3>Примеры целиком</h3>
<div class="ex"><span class="de">Herr Klein ist <b>ein kleiner Mann</b>. Er hat <b>eine kleine Nase</b>. Sie haben <b>ein kleines Kind</b>.</span>
<span class="ru">Господин Кляйн — маленький мужчина. У него маленький нос. У них маленький ребёнок.</span></div>
<div class="ex"><span class="de">Ich brauche <b>einen neuen Pullover</b>, <b>eine warme Jacke</b> und <b>ein weißes Hemd</b>.</span>
<span class="ru">Мне нужен новый свитер, тёплая куртка и белая рубашка.</span></div>
`
    },
    {
      title: "der / die / das + прилагательное — стена из -en",
      html: `
<p>Определённый артикль всегда показывает и род, и падеж. Сигнал уже прозвучал — значит прилагательное молчит. Молчание в немецком звучит только двумя способами: <span class="end">-e</span> и <span class="end">-en</span>. Третьего варианта не существует.</p>

<div class="hack">
  <span class="lbl">Хак № 6 · пять клеток и стена</span>
  Нарисуй таблицу 4×3. Пять клеток сверху слева — <span class="end">-e</span>. Всё остальное — <span class="end">-en</span>.
  <span class="big">Nominativ (все три рода) + Akkusativ (die / das) = -e<br>ВСЁ остальное = -en</span>
  Больше в слабом склонении знать нечего.
</div>

<div class="scrollx">
<table class="tbl">
<tr><th></th><th>маскулинум</th><th>нейтрум</th><th>фемининум</th><th>плюраль</th></tr>
<tr><th>Nominativ</th>
  <td class="m">der klein<span class="end">e</span> Mann</td>
  <td class="n">das klein<span class="end">e</span> Kind</td>
  <td class="f">die klein<span class="end">e</span> Frau</td>
  <td class="p">die klein<span class="end">en</span> Kinder</td></tr>
<tr><th>Akkusativ</th>
  <td class="m hl">den klein<span class="end">en</span> Mann</td>
  <td class="n">das klein<span class="end">e</span> Kind</td>
  <td class="f">die klein<span class="end">e</span> Frau</td>
  <td class="p">die klein<span class="end">en</span> Kinder</td></tr>
<tr><th>Dativ</th>
  <td class="m">dem klein<span class="end">en</span> Mann</td>
  <td class="n">dem klein<span class="end">en</span> Kind</td>
  <td class="f">der klein<span class="end">en</span> Frau</td>
  <td class="p">den klein<span class="end">en</span> Kindern</td></tr>
</table>
</div>

<div class="matrix">
  <div class="cell head">der</div><div class="cell head">das</div><div class="cell head">die</div><div class="cell head">Plural</div>
  <div class="cell m"><b>-e</b>Nom.</div>
  <div class="cell n"><b>-e</b>Nom. + Akk.</div>
  <div class="cell f"><b>-e</b>Nom. + Akk.</div>
  <div class="cell p"><b>-en</b>всегда</div>
  <div class="cell m hl"><b>-en</b>Akk. + Dat.</div>
  <div class="cell n"><b>-en</b>Dativ</div>
  <div class="cell f"><b>-en</b>Dativ</div>
  <div class="cell p"><b>-en</b>всегда</div>
</div>
<p class="muted">Подсвечена клетка, на которой спотыкаются все: мужской род в Akkusativ.</p>

<div class="hack">
  <span class="lbl">Хак № 7 · мужчина снова тонет в «-n»</span>
  <div class="rhyme">de<span>n</span> kleine<span>n</span> Man<span>n</span></div>
  <span class="de">Der klein<b>e</b> Mann sieht den Lehrer.</span> — кто? Nominativ, <span class="end">-e</span>.<br>
  <span class="de">Ich sehe den klein<b>en</b> Mann.</span> — кого? Akkusativ, <span class="end">-en</span>.
  <b>Это главная ошибка урока:</b> «Ich sehe der kleine Mann» — так говорить нельзя.
</div>

<h3>Один корень — два разных окончания подряд</h3>
<div class="ex"><span class="de">Das ist <b>ein altes</b> Haus. <b>Das alte</b> Haus steht in der Stadt.</span>
<span class="ru">Это старый дом. Этот старый дом стоит в городе.</span></div>
<p>В первом предложении артикль <span class="de">ein</span> промолчал — прилагательное взяло хвост <span class="end">-es</span>. Во втором <span class="de">das</span> уже всё сказало — прилагательному хватило <span class="end">-e</span>. Хак № 2 работает в обе стороны.</p>
`
    },
    {
      title: "Dativ и слова совсем без артикля",
      html: `
<h3>Dativ: одна буква на все случаи</h3>
<p>Как только появляется Dativ и перед прилагательным стоит хоть какой-то артикль — окончание <span class="end">-en</span>. Всегда. Без исключений, без родов.</p>

<div class="hack">
  <span class="lbl">Хак № 8 · Dativ всё выравнивает</span>
  <span class="big">dem / der / einem / einer / meinen … + прилагательное → <span class="end">-en</span></span>
  <span class="de">mit dem neu<b>en</b> Lehrer · mit einer alt<b>en</b> Frau · aus einem klein<b>en</b> Dorf · mit meinen gut<b>en</b> Freunden</span>
  Мужской, женский, средний, множественное — одинаково. Dativ — самый лёгкий падеж в этой теме.
</div>

<div class="ex"><span class="de">Ich helfe <b>einem alten Mann</b>. Das Buch gehört <b>einem kleinen Kind</b>. Er wohnt in <b>einer kleinen Stadt</b>. Wir helfen <b>kleinen Menschen</b>.</span>
<span class="ru">Я помогаю пожилому мужчине. Книга принадлежит маленькому ребёнку. Он живёт в маленьком городе. Мы помогаем маленьким людям.</span></div>

<h3>Артикля нет вообще — прилагательное работает за двоих</h3>
<p>Вещество, абстракция, множественное число: <span class="de">Kaffee, Wasser, Milch, Kinder</span>. Артикля нет — сигнала нет — прилагательное берёт хвост определённого артикля целиком.</p>

<div class="cut">
  de<span class="tail">R</span> Kaffee <span class="arrow">→</span> kalte<span class="tail">r</span> Kaffee
  <small>Nominativ</small>
  de<span class="tail">M</span> Wasser <span class="arrow">→</span> mit kalte<span class="tail">m</span> Wasser
  <small>Dativ</small>
  de<span class="tail">R</span> Milch <span class="arrow">→</span> mit kalte<span class="tail">r</span> Milch
  <small>Dativ фем.</small>
</div>

<div class="scrollx">
<table class="tbl">
<tr><th></th><th>маскулинум</th><th>нейтрум</th><th>фемининум</th><th>плюраль</th></tr>
<tr><th>Nominativ</th>
  <td class="m">kalt<span class="end">er</span> Kaffee</td>
  <td class="n">kalt<span class="end">es</span> Wasser</td>
  <td class="f">kalt<span class="end">e</span> Milch</td>
  <td class="p">klein<span class="end">e</span> Kinder</td></tr>
<tr><th>Akkusativ</th>
  <td class="m">kalt<span class="end">en</span> Kaffee</td>
  <td class="n">kalt<span class="end">es</span> Wasser</td>
  <td class="f">kalt<span class="end">e</span> Milch</td>
  <td class="p">klein<span class="end">e</span> Kinder</td></tr>
<tr><th>Dativ</th>
  <td class="m">mit kalt<span class="end">em</span> Kaffee</td>
  <td class="n">mit kalt<span class="end">em</span> Wasser</td>
  <td class="f">mit kalt<span class="end">er</span> Milch</td>
  <td class="p">mit klein<span class="end">en</span> Kindern</td></tr>
</table>
</div>

<div class="hack">
  <span class="lbl">Хак № 9 · множественное число и «все эти» слова</span>
  <span class="de">viele, wenige, einige, mehrere</span> сами не считаются артиклем — после них прилагательное продолжает сигналить:
  <span class="big">viele klein<span class="end">e</span> Kinder · mit vielen klein<span class="end">en</span> Kindern</span>
  А <span class="de">die beiden, die anderen, alle, diese</span> — считаются, после них всегда <span class="end">-en</span>:
  <span class="de">die beid<b>en</b> Diebe · in den ander<b>en</b> Nächten · alle klein<b>en</b> Tiere</span>
</div>

<div class="hack">
  <span class="lbl">Ловушка</span>
  В Dativ Plural <b>-n</b> появляется дважды: у прилагательного и у самого существительного.
  <span class="de">mit klein<b>en</b> Kinder<b>n</b> · mit gut<b>en</b> Freund<b>en</b></span>
  Забыть <span class="end">-n</span> на существительном — типичная ошибка.
</div>
`
    },
    {
      title: "Welcher? или Was für ein? — два разных вопроса",
      html: `
<p>Оба переводятся «какой», но спрашивают о разном. Перепутать — значит получить не тот ответ.</p>

<div class="hack">
  <span class="lbl">Хак № 10 · выбор из полки против описания</span>
  <span class="big"><b>Welcher?</b> — который из известных → ответ с <b>определённым</b> артиклем<br><b>Was für ein?</b> — какой по свойству → ответ с <b>неопределённым</b></span>
  <span class="de">Welch<b>er</b> Schüler stört? — <b>Der</b> freche Schüler.</span><br>
  <span class="de">Was für <b>ein</b> Tag war gestern? — <b>Ein</b> schöner Tag.</span>
</div>

<h3>welch- склоняется ровно как der</h3>
<div class="cut">
  de<span class="tail">R</span> Tag <span class="arrow">→</span> welche<span class="tail">r</span> Tag
  <small>Nominativ</small>
  de<span class="tail">N</span> Text <span class="arrow">→</span> welche<span class="tail">n</span> Text
  <small>Akkusativ</small>
  de<span class="tail">M</span> Tag <span class="arrow">→</span> an welche<span class="tail">m</span> Tag
  <small>Dativ</small>
</div>
<div class="ex"><span class="de">An <b>welchem</b> Tag hast du Geburtstag? · Mit <b>welcher</b> Hand schreibst du? · <b>Welches</b> Auge ist groß? · In <b>welchem</b> Schrank hängt die Hose?</span>
<span class="ru">В какой день у тебя день рождения? · Какой рукой ты пишешь? · Какой глаз большой? · В каком шкафу висит брюки?</span></div>

<div class="hack">
  <span class="lbl">Хак № 11 · «für» здесь не предлог</span>
  В <span class="de">was für ein</span> предлог <span class="de">für</span> ничем не управляет — это застывшая формула. Падеж у <span class="de">ein</span> задаёт глагол или настоящий предлог:
  <span class="big">Was für ein<span class="end">en</span> Mantel hast du gekauft? <span class="muted">→ kaufen = Akkusativ</span><br>In was für ein<span class="end">er</span> Stadt wohnst du? <span class="muted">→ in + wo = Dativ</span></span>
  <b>Главная ошибка:</b> ставить Akkusativ из-за «für». Смотри на глагол, а не на für.
</div>

<div class="hack">
  <span class="lbl">Хак № 12 · множественное число теряет ein</span>
  У <span class="de">ein</span> нет множественного — значит и в вопросе его нет:
  <span class="big">Was für Haare hat sie? — Schwarze Haare.<br>Was für Diebe klettern ins Haus? — Böse Diebe.</span>
</div>
`
    },
    {
      title: "Stolpersteine: слова, которые ломаются при склонении",
      html: `
<p>Шесть подвохов, на которых сыпется даже тот, кто знает все три таблицы наизусть.</p>

<div class="hack">
  <span class="lbl">Хак № 13 · hoch теряет -c-</span>
  <span class="big">hoch → <b>hoh</b>-</span>
  <span class="de">Das Haus ist <b>hoch</b>. → ein <b>hohes</b> Haus · die <b>hohe</b> Leiter</span>
  Без окончания — <span class="de">hoch</span>, с окончанием — <span class="de">hoh-</span>. «Hoches Haus» не существует.
</div>

<div class="hack">
  <span class="lbl">Хак № 14 · -el и -er выбрасывают -e-</span>
  <span class="big">dunkel → dunkl- · teuer → teur- · sauer → saur- · edel → edl-</span>
  <span class="de">die <b>dunkle</b> Straße · in dem <b>dunklen</b> Zimmer · ein <b>teures</b> Handy · <b>saure</b> Milch</span>
  Причина простая: два безударных «e» подряд немцу не выговорить.
</div>

<div class="hack">
  <span class="lbl">Хак № 15 · rechts и links — это наречия</span>
  Перед существительным они превращаются в прилагательные <span class="de">recht-</span> и <span class="de">link-</span>, буква <b>s</b> отваливается.
  <span class="big">rechts <span class="arrow">→</span> auf der recht<span class="end">en</span> Seite · im link<span class="end">en</span> Schrank</span>
  <span class="de">Er hat im <b>rechten</b> Ohr einen Ohrring.</span> — не «rechtsen».
</div>

<div class="hack">
  <span class="lbl">Хак № 16 · порядковые числительные — обычные прилагательные</span>
  <span class="de">der <b>erste</b> Dieb · der <b>zweite</b> Polizist · am <b>zwölften</b> Februar · das <b>nächste</b> Zimmer</span>
  Склоняются по тем же таблицам, никакой отдельной логики нет.
</div>

<div class="hack">
  <span class="lbl">Хак № 17 · причастия работают как прилагательные</span>
  <span class="de">ein <b>kariertes</b> Hemd · eine <b>gestreifte</b> Hose · ein <b>aufgeschlagenes</b> Buch · <b>gegelte</b> Haare</span>
  Берёшь Partizip II и склоняешь, как любое прилагательное.
</div>

<div class="hack">
  <span class="lbl">Хак № 18 · пять слов, которые не склоняются вообще</span>
  <span class="big">rosa · lila · orange · prima · super</span>
  <span class="de">eine <b>rosa</b> Jacke · ein <b>lila</b> Hemd · die <b>orange</b> Mütze</span>
  Никаких окончаний, даже если очень хочется.
</div>

<div class="ex"><span class="de">Sie klettern schnell die <b>hohe</b> Leiter hinauf und sehen die <b>beiden</b> Diebe in dem <b>dunklen</b> Zimmer. Der <b>erste</b> Polizist hält einen <b>großen</b> Säbel in seiner <b>rechten</b> Hand.</span>
<span class="ru">Они быстро взбираются по высокой лестнице и видят обоих воров в тёмной комнате. Первый полицейский держит большую саблю в правой руке.</span></div>
`
    }
  ],

  days: [
    {
      title: "Окончание есть или нет + ein/eine в Nominativ",
      sub: "Атрибут против сказуемого, мужской и женский род",
      grammar: [0, 1],
      ex: [
        { type: "choice",
          q: "Das Wetter ist heute sehr ___ .",
          opts: ["schön", "schöner", "schönes"], a: 0,
          ru: "Погода сегодня очень хорошая.",
          why: "После sein прилагательное стоит без окончания — оно не перед существительным." },

        { type: "choice",
          q: "Heute haben wir ___ Wetter.",
          opts: ["schön", "schönes", "schöner"], a: 1,
          ru: "Сегодня у нас хорошая погода.",
          why: "das Wetter, средний род, а артикля нет вовсе — прилагательное берёт хвост от das: schönes." },

        { type: "choice",
          q: "Herr Rot ist ein ___ Lehrer.",
          opts: ["gut", "gute", "guter"], a: 2,
          ru: "Господин Рот — хороший учитель.",
          why: "der Lehrer, Nominativ после sein. «ein» не показывает род, поэтому прилагательное берёт -er от der." },

        { type: "fill",
          q: "Das ist ein {schön} Pullover.", a: ["schöner"],
          ru: "Это красивый свитер.",
          why: "der Pullover, Nominativ: ein schöner Pullover." },

        { type: "fill",
          q: "Das ist eine {schön} Jacke.", a: ["schöne"],
          ru: "Это красивая куртка.",
          why: "die Jacke — «eine» уже сигналит женский род, прилагательному хватает -e." },

        { type: "fill",
          q: "Das ist ein {schön} Hemd.", a: ["schönes"],
          ru: "Это красивая рубашка.",
          why: "das Hemd — прилагательное берёт хвост от das: schönes." },

        { type: "choice",
          q: "Sie ist ___ Frau.",
          opts: ["eine kleine", "eine kleiner", "ein kleines"], a: 0,
          ru: "Она невысокая женщина.",
          why: "die Frau, Nominativ: eine kleine Frau." },

        { type: "fill",
          q: "Unser Lehrer ist ein {streng} Mann, aber er ist auch ein {nett} Mensch.",
          a: ["strenger", "netter"],
          ru: "Наш учитель — строгий человек, но при этом приятный.",
          why: "der Mann, der Mensch — оба Nominativ после sein, оба получают -er." },

        { type: "fill",
          q: "Das ist ein {alt} Auto, aber es ist ein {gut} Auto.",
          a: ["altes", "gutes"],
          ru: "Это старая машина, но хорошая машина.",
          why: "das Auto — оба раза -es." },

        { type: "choice",
          q: "Meine Schwester hat ___ Haare.",
          opts: ["lang", "lange", "langes"], a: 1,
          ru: "У моей сестры длинные волосы.",
          why: "die Haare — множественное число, перед ним нет ein-слова, но окончание нужно: lange Haare. Множественное подробно разберём позже." },

        { type: "order",
          words: ["Das", "ist", "eine", "interessante", "Aufgabe"],
          a: ["Das ist eine interessante Aufgabe"],
          ru: "Это интересное задание.",
          prompt: "Собери предложение из слов." },

        { type: "order",
          words: ["Er", "ist", "ein", "fleißiger", "Schüler"],
          a: ["Er ist ein fleißiger Schüler"],
          ru: "Он прилежный ученик." },

        { type: "translate",
          ru: "Это новый компьютер.",
          a: ["Das ist ein neuer Computer.", "Das ist ein neuer Computer"],
          why: "der Computer → ein neuer Computer." },

        { type: "translate",
          ru: "Она красивая девушка.",
          a: ["Sie ist ein schönes Mädchen.", "Sie ist ein schönes Mädchen", "Sie ist ein hübsches Mädchen.", "Sie ist ein hübsches Mädchen"],
          why: "das Mädchen — средний род, несмотря на смысл: ein schönes Mädchen." },

        { type: "pairs",
          prompt: "Соедини прилагательное с его противоположностью.",
          pairs: [["groß", "klein"], ["alt", "jung"], ["hell", "dunkel"], ["sauber", "schmutzig"], ["laut", "leise"], ["fleißig", "faul"]] },

        { type: "fill",
          q: "Der Bus ist nicht leer, sondern {}. Die Schnecke ist nicht schnell, sondern {}.",
          a: [["voll"], ["langsam"]],
          ru: "Автобус не пустой, а полный. Улитка не быстрая, а медленная.",
          why: "После sondern прилагательное снова стоит после глагола — окончания нет." }
      ]
    },
    {
      title: "Akkusativ и описание человека",
      sub: "ein/kein/mein в Akkusativ, одежда и внешность",
      grammar: [1],
      ex: [
        { type: "choice",
          q: "Ich brauche ___ neuen Pullover.",
          opts: ["einen", "ein", "einer"], a: 0,
          ru: "Мне нужен новый свитер.",
          why: "brauchen требует Akkusativ, der Pullover — мужской род: einen neuen Pullover." },

        { type: "choice",
          q: "Homer Simpson hat einen ___ Bauch.",
          opts: ["dicken", "dicker", "dickes"], a: 0,
          ru: "У Гомера Симпсона толстый живот.",
          why: "der Bauch, haben → Akkusativ. Мужской род в Akkusativ: einen dicken Bauch, всё на -n." },

        { type: "fill",
          q: "Asterix ist ein {klein} Mann. Er hat {blond} Haare und einen {blond} Schnurrbart.",
          a: ["kleiner", "blonde", "blonden"],
          ru: "Астерикс — маленький мужчина. У него светлые волосы и светлые усы.",
          why: "Nominativ м. р. после sein → -er. Haare — множественное без артикля → -e. der Schnurrbart в Akkusativ → einen blonden." },

        { type: "fill",
          q: "Er trägt ein {schwarz} Hemd und eine {rot} Hose.",
          a: ["schwarzes", "rote"],
          ru: "Он носит чёрную рубашку и красные брюки.",
          why: "das Hemd в Akkusativ не меняется: ein schwarzes. die Hose в Akkusativ тоже не меняется: eine rote." },

        { type: "fill",
          q: "Homer hat {schmal} Schultern, aber einen {dick} Bauch.",
          a: ["schmale", "dicken"],
          ru: "У Гомера узкие плечи, но толстый живот.",
          why: "Schultern — множественное без артикля, Akkusativ → -e. Мужской род в Akkusativ → -en." },

        { type: "choice",
          q: "Mickey Maus ist ziemlich ___ .",
          opts: ["klein", "kleiner", "kleines"], a: 0,
          ru: "Микки-Маус довольно маленький.",
          why: "После sein справа нет существительного — прилагательное голое. Классическая ловушка на автопилоте." },

        { type: "fill",
          q: "Supermann ist ein {stark} Mann. Er hat {viel} Muskeln und sehr {breit} Schultern.",
          a: ["starker", "viele", "breite"],
          ru: "Супермен — сильный мужчина. У него много мышц и очень широкие плечи.",
          why: "Nominativ после sein → starker. viele и breite — множественное в Akkusativ без артикля, оба на -e." },

        { type: "fill",
          q: "Seine Haare sind {schwarz} und {lockig}.",
          a: ["schwarz", "lockig"],
          ru: "Его волосы чёрные и кудрявые.",
          why: "sind — значит прилагательные стоят после глагола. Окончания нет, хотя подлежащее во множественном числе." },

        { type: "choice",
          q: "Er trägt einen blauen Anzug, außerdem noch ___ Stiefel.",
          opts: ["rote", "roten", "roter"], a: 0,
          ru: "Он носит синий костюм, а к нему ещё красные сапоги.",
          why: "die Stiefel — множественное, артикля нет, Akkusativ. Хвост от die → rote Stiefel." },

        { type: "fill",
          q: "Der Babyschlumpf hat einen {blau} Körper. In seinem Mund hält er einen {grün} Schnuller.",
          a: ["blauen", "grünen"],
          ru: "Малыш-смурф синего цвета. Во рту он держит зелёную соску.",
          why: "Оба существительных мужского рода в Akkusativ — оба прилагательных на -en." },

        { type: "fill",
          q: "Das ist kein {gut} Test, das ist ein {schlecht} Test.",
          a: ["guter", "schlechter"],
          ru: "Это не хороший тест, это плохой тест.",
          why: "kein склоняется точно как ein. Nominativ после sein → -er оба раза." },

        { type: "order",
          words: ["Ich", "brauche", "eine", "warme", "Jacke"],
          a: ["Ich brauche eine warme Jacke"],
          ru: "Мне нужна тёплая куртка." },

        { type: "order",
          words: ["Donald", "trägt", "immer", "eine", "blaue", "Mütze"],
          a: ["Donald trägt immer eine blaue Mütze"],
          ru: "Дональд всегда носит синюю шапку." },

        { type: "translate",
          ru: "Я покупаю новую куртку.",
          a: ["Ich kaufe eine neue Jacke.", "Ich kaufe eine neue Jacke"],
          why: "kaufen → Akkusativ, женский род в Akkusativ не меняется: eine neue Jacke." },

        { type: "translate",
          ru: "У него длинный нос.",
          a: ["Er hat eine lange Nase.", "Er hat eine lange Nase"],
          why: "die Nase — женский род, несмотря на русский мужской. Akkusativ: eine lange Nase." },

        { type: "translate",
          ru: "У них маленький ребёнок.",
          a: ["Sie haben ein kleines Kind.", "Sie haben ein kleines Kind"],
          why: "das Kind — средний род, в Akkusativ форма та же, что в Nominativ: ein kleines Kind." },

        { type: "pairs",
          prompt: "Соедини немецкое слово с переводом.",
          pairs: [["der Schnurrbart", "усы"], ["die Mütze", "шапка"], ["der Anzug", "костюм"], ["der Gürtel", "ремень"], ["die Weste", "жилет"], ["der Ärmel", "рукав"]] }
      ]
    },
    {
      title: "der / die / das + прилагательное",
      sub: "Слабое склонение и главная ловушка — Akkusativ мужского рода",
      grammar: [2],
      ex: [
        { type: "choice",
          q: "Der ___ Schüler stört immer.",
          opts: ["freche", "frecher", "frechen"], a: 0,
          ru: "Наглый ученик вечно мешает.",
          why: "der уже сказал всё: род и Nominativ. Прилагательному остаётся слабое -e." },

        { type: "choice",
          q: "Der Lehrer fragt den ___ Schüler.",
          opts: ["gute", "guten", "guter"], a: 1,
          ru: "Учитель спрашивает хорошего ученика.",
          why: "den — мужской род в Akkusativ, за ним всегда -en. Это подсвеченная клетка таблицы." },

        { type: "fill",
          q: "Ich lese den {neu} Text und lerne die {lang} Sätze.",
          a: ["neuen", "langen"],
          ru: "Я читаю новый текст и учу длинные предложения.",
          why: "den + м. р. Akkusativ → -en. die Sätze — множественное, там -en всегда." },

        { type: "fill",
          q: "Das {klein} Kind spielt draußen. Die {alt} Frau öffnet das Fenster.",
          a: ["kleine", "alte"],
          ru: "Маленький ребёнок играет на улице. Пожилая женщина открывает окно.",
          why: "Оба Nominativ — верхний ряд таблицы, там везде -e." },

        { type: "fill",
          q: "Das ist ein {alt} Haus. Das {alt} Haus steht in der Stadt.",
          a: ["altes", "alte"],
          ru: "Это старый дом. Этот старый дом стоит в городе.",
          why: "Первый раз артикль ein промолчал — прилагательное берёт хвост от das. Второй раз das всё сказало — хватает -e. Одно слово, два окончания." },

        { type: "fill",
          q: "Ein {jung} Mann kommt. Der {jung} Mann fragt den {alt} Lehrer.",
          a: ["junger", "junge", "alten"],
          ru: "Приходит молодой мужчина. Молодой мужчина спрашивает старого учителя.",
          why: "ein → -er (сигнала нет), der → -e (сигнал есть), den → -en (Akkusativ мужского рода)." },

        { type: "choice",
          q: "___ Dieb sieht die Polizistin.",
          opts: ["Der junge", "Den jungen", "Der jungen"], a: 0,
          ru: "Молодой вор видит полицейскую.",
          why: "Подлежащее стоит в Nominativ: der junge Dieb. Кто видит — тот в Nominativ." },

        { type: "choice",
          q: "Die Polizistin sieht ___ Dieb.",
          opts: ["der junge", "den jungen", "den junge"], a: 1,
          ru: "Полицейская видит молодого вора.",
          why: "Здесь вор — дополнение: кого видит? Akkusativ мужского рода → den jungen Dieb." },

        { type: "fill",
          q: "Der {erst} Dieb ist schlank, der {zweit} Dieb ist dick.",
          a: ["erste", "zweite"],
          ru: "Первый вор стройный, второй вор толстый.",
          why: "Порядковые числительные склоняются как обычные прилагательные: der erste, der zweite. А schlank и dick после sein остаются голыми." },

        { type: "choice",
          q: "In welchem Schrank hängt die Hose? — Im ___ Schrank.",
          opts: ["linke", "linken", "linkem"], a: 1,
          ru: "В каком шкафу висят брюки? — В левом шкафу.",
          why: "im = in dem, Dativ. После определённого артикля в Dativ всегда -en. И links теряет -s: link-." },

        { type: "choice",
          q: "___ Diebe klettern durch das Fenster.",
          opts: ["Die beiden", "Die beide", "Der beiden"], a: 0,
          ru: "Оба вора лезут через окно.",
          why: "beide во множественном после die ведёт себя как прилагательное: die beiden Diebe." },

        { type: "order",
          words: ["Ich", "kenne", "den", "neuen", "Lehrer"],
          a: ["Ich kenne den neuen Lehrer"],
          ru: "Я знаю нового учителя." },

        { type: "order",
          words: ["Der", "kleine", "Junge", "trägt", "die", "roten", "Schuhe"],
          a: ["Der kleine Junge trägt die roten Schuhe"],
          ru: "Маленький мальчик носит красные ботинки." },

        { type: "translate",
          ru: "Я знаю эту старую женщину.",
          a: ["Ich kenne die alte Frau.", "Ich kenne die alte Frau"],
          why: "Женский род в Akkusativ не меняется: die alte Frau." },

        { type: "translate",
          ru: "Учитель спрашивает наглого ученика.",
          a: ["Der Lehrer fragt den frechen Schüler.", "Der Lehrer fragt den frechen Schüler"],
          why: "den frechen Schüler — мужской род в Akkusativ, обе формы на -n." },

        { type: "pairs",
          prompt: "Соедини форму с падежом.",
          pairs: [["der kleine Mann", "Nominativ"], ["den kleinen Mann", "Akkusativ"], ["dem kleinen Mann", "Dativ"], ["ein kleiner Mann", "Nominativ ohne Signal"], ["einen kleinen Mann", "Akkusativ mit ein"]] }
      ]
    },
    {
      title: "Dativ и слова без артикля",
      sub: "mit dem neuen Lehrer, mit kalter Milch, viele kleine Kinder",
      grammar: [3],
      ex: [
        { type: "choice",
          q: "Ich helfe ___ Mann.",
          opts: ["einem alten", "einen alten", "ein alter"], a: 0,
          ru: "Я помогаю пожилому мужчине.",
          why: "helfen требует Dativ. В Dativ прилагательное всегда на -en: einem alten Mann." },

        { type: "choice",
          q: "Das Buch gehört ___ Kind.",
          opts: ["einem kleinen", "ein kleines", "einer kleinen"], a: 0,
          ru: "Книга принадлежит маленькому ребёнку.",
          why: "gehören + Dativ, das Kind → einem kleinen Kind." },

        { type: "fill",
          q: "Er wohnt in einer {klein} Stadt und arbeitet mit einem {nett} Kollegen.",
          a: ["kleinen", "netten"],
          ru: "Он живёт в маленьком городе и работает с приятным коллегой.",
          why: "in + wo? → Dativ, mit → всегда Dativ. Оба раза -en, род роли не играет." },

        { type: "fill",
          q: "Das gehört einem {klein} Kind. Wir helfen {klein} Menschen.",
          a: ["kleinen", "kleinen"],
          ru: "Это принадлежит маленькому ребёнку. Мы помогаем маленьким людям.",
          why: "Dativ единственного с артиклем → -en. Dativ множественного вообще без артикля → тоже -en." },

        { type: "choice",
          q: "Donald trägt eine Mütze mit ___ Band.",
          opts: ["einem schwarzen", "einen schwarzen", "ein schwarzes"], a: 0,
          ru: "Дональд носит шапку с чёрной лентой.",
          why: "mit — предлог Dativ, всегда. das Band → einem schwarzen Band. Ловушка: соблазн поставить Akkusativ после trägt." },

        { type: "fill",
          q: "Ich trinke Kaffee mit {kalt} Milch und esse Brot mit {frisch} Butter.",
          a: ["kalter", "frischer"],
          ru: "Я пью кофе с холодным молоком и ем хлеб со свежим маслом.",
          why: "Артикля нет вовсе. Прилагательное берёт хвост от der Milch / der Butter в Dativ → -er." },

        { type: "choice",
          q: "Ich wasche mich mit ___ Wasser.",
          opts: ["kaltem", "kaltes", "kalter"], a: 0,
          ru: "Я умываюсь холодной водой.",
          why: "das Wasser в Dativ — dem. Артикля нет, прилагательное берёт хвост -m: kaltem Wasser." },

        { type: "fill",
          q: "{Kalt} Kaffee schmeckt nicht. {Frisch} Brot schmeckt gut.",
          a: ["Kalter", "Frisches"],
          ru: "Холодный кофе невкусный. Свежий хлеб вкусный.",
          why: "Nominativ без артикля: der Kaffee → kalter, das Brot → frisches." },

        { type: "choice",
          q: "Hier sind viele ___ Kinder.",
          opts: ["kleine", "kleinen", "kleiner"], a: 0,
          ru: "Здесь много маленьких детей.",
          why: "viele не артикль — сигнала нет, прилагательное сигналит само: viele kleine Kinder." },

        { type: "choice",
          q: "In den ___ Nächten ist es ruhig.",
          opts: ["andere", "anderen", "anderer"], a: 1,
          ru: "В другие ночи тихо.",
          why: "den — артикль в Dativ Plural, после него -en. И у существительного тоже -n: Nächten." },

        { type: "fill",
          q: "Alle lieben {klein} Tiere. Wir spielen mit {klein} Kindern.",
          a: ["kleine", "kleinen"],
          ru: "Все любят маленьких животных. Мы играем с маленькими детьми.",
          why: "Akkusativ Plural без артикля → -e. Dativ Plural без артикля → -en, плюс -n у существительного." },

        { type: "fill",
          q: "In dieser {gefährlich} Situation haben die zwei {bös} Diebe eine {gut} Idee.",
          a: ["gefährlichen", "bösen", "gute"],
          ru: "В этой опасной ситуации у двух злых воров появляется хорошая идея.",
          why: "dieser = Dativ ж. р. → -en. die zwei bösen — множественное после артикля → -en. eine gute Idee — Akkusativ ж. р. → -e." },

        { type: "order",
          words: ["Ich", "gebe", "dem", "kleinen", "Kind", "einen", "Apfel"],
          a: ["Ich gebe dem kleinen Kind einen Apfel"],
          ru: "Я даю маленькому ребёнку яблоко." },

        { type: "order",
          words: ["Wir", "fahren", "mit", "einem", "alten", "Auto"],
          a: ["Wir fahren mit einem alten Auto"],
          ru: "Мы едем на старой машине." },

        { type: "translate",
          ru: "Я говорю с новым учителем.",
          a: ["Ich spreche mit dem neuen Lehrer.", "Ich spreche mit dem neuen Lehrer", "Ich rede mit dem neuen Lehrer.", "Ich rede mit dem neuen Lehrer"],
          why: "mit dem neuen Lehrer — Dativ, окончание -en." },

        { type: "translate",
          ru: "Он живёт в маленьком городе.",
          a: ["Er wohnt in einer kleinen Stadt.", "Er wohnt in einer kleinen Stadt"],
          why: "in + wo? → Dativ: in einer kleinen Stadt." },

        { type: "translate",
          ru: "Я пью кофе с холодным молоком.",
          a: ["Ich trinke Kaffee mit kalter Milch.", "Ich trinke Kaffee mit kalter Milch"],
          why: "Артикля нет — прилагательное берёт хвост der (Dativ женского рода): kalter Milch." }
      ]
    },
    {
      title: "Welcher? Was für ein? и подвохи",
      sub: "Вопросы к прилагательному плюс hoch, dunkel, teuer, rechts",
      grammar: [4, 5],
      ex: [
        { type: "choice",
          q: "___ Schüler stört immer? — Der freche Schüler.",
          opts: ["Welcher", "Was für ein", "Welchen"], a: 0,
          ru: "Который ученик вечно мешает? — Наглый ученик.",
          why: "Ответ с определённым артиклем — значит спрашивали welcher: выбор из известных." },

        { type: "choice",
          q: "___ Tag war gestern? — Ein schöner Tag.",
          opts: ["Was für ein", "Welcher", "Was für einen"], a: 0,
          ru: "Что за день был вчера? — Хороший день.",
          why: "Ответ с неопределённым артиклем — спрашивали о свойстве: was für ein. Nominativ, поэтому ein, не einen." },

        { type: "fill",
          q: "An {welch} Tag hast du Geburtstag? — Am ersten April.",
          a: ["welchem"],
          ru: "В какой день у тебя день рождения? — Первого апреля.",
          why: "an + wann? → Dativ. welch- склоняется как der: an welchem Tag." },

        { type: "fill",
          q: "Was für {ein} Mantel hast du gekauft? — Einen warmen Mantel.",
          a: ["einen"],
          ru: "Какое пальто ты купил? — Тёплое пальто.",
          why: "Падеж задаёт kaufen, а не für: Akkusativ мужского рода → einen." },

        { type: "fill",
          q: "In was für {ein} Stadt wohnst du? — In einer kleinen Stadt.",
          a: ["einer"],
          ru: "В каком городе ты живёшь? — В маленьком городе.",
          why: "Работает предлог in + wo? → Dativ женского рода: einer. für здесь ничем не управляет." },

        { type: "choice",
          q: "Mit ___ Hand schreibst du?",
          opts: ["welcher", "welche", "welchem"], a: 0,
          ru: "Какой рукой ты пишешь?",
          why: "mit + Dativ, die Hand → der Hand → welcher Hand." },

        { type: "choice",
          q: "___ Haare hat sie? — Schwarze Haare.",
          opts: ["Was für", "Was für eine", "Was für ein"], a: 0,
          ru: "Какие у неё волосы? — Чёрные волосы.",
          why: "Множественное число: у ein нет формы Plural, поэтому просто was für." },

        { type: "fill",
          q: "Das Haus ist hoch. Es ist ein {hoch} Haus mit einer {hoch} Mauer.",
          a: ["hohes", "hohen"],
          ru: "Дом высокий. Это высокий дом с высокой стеной.",
          why: "hoch перед существительным теряет -c-: hoh-. das Haus → hohes, mit einer → Dativ → hohen." },

        { type: "fill",
          q: "Das Zimmer ist dunkel. Sie stehen in dem {dunkel} Zimmer an der {dunkel} Straße.",
          a: ["dunklen", "dunklen"],
          ru: "Комната тёмная. Они стоят в тёмной комнате на тёмной улице.",
          why: "dunkel выбрасывает -e- перед окончанием: dunkl-. Оба раза Dativ → -en." },

        { type: "choice",
          q: "Das Handy ist teuer. Ich kaufe kein ___ Handy.",
          opts: ["teures", "teueres", "teurees"], a: 0,
          ru: "Телефон дорогой. Я не покупаю дорогой телефон.",
          why: "teuer теряет -e- в корне: teur- + окончание -es от das." },

        { type: "fill",
          q: "Er hat im {recht} Ohr einen Ohrring und trägt eine {kariert} Mütze.",
          a: ["rechten", "karierte"],
          ru: "У него в правом ухе серьга, и он носит шапку в клетку.",
          why: "rechts теряет -s и становится прилагательным: im rechten Ohr (Dativ). kariert — причастие, склоняется как обычное прилагательное." },

        { type: "fill",
          q: "Zwei {stark} Polizisten haben das {laut} Schreien der {alt} Frau gehört.",
          a: ["starke", "laute", "alten"],
          ru: "Два сильных полицейских услышали громкий крик пожилой женщины.",
          why: "zwei не артикль → starke. das + Akkusativ ср. р. → laute. der Frau — здесь Genitiv женского рода, там тоже -en." },

        { type: "choice",
          q: "Sie trägt eine ___ Jacke.",
          opts: ["rosa", "rosae", "rosane"], a: 0,
          ru: "Она носит розовую куртку.",
          why: "rosa, lila, orange не склоняются никогда — окончания у них не бывает." },

        { type: "order",
          words: ["Was", "für", "einen", "Pullover", "ziehst", "du", "an"],
          a: ["Was für einen Pullover ziehst du an"],
          ru: "Какой свитер ты надеваешь?" },

        { type: "order",
          words: ["Welche", "Schuhe", "hat", "er", "angezogen"],
          a: ["Welche Schuhe hat er angezogen"],
          ru: "Какие ботинки он надел?" },

        { type: "translate",
          ru: "Что за куртку он носит?",
          a: ["Was für eine Jacke trägt er?", "Was für eine Jacke trägt er"],
          why: "tragen → Akkusativ, женский род: eine Jacke. Форма ein здесь не меняется относительно Nominativ." },

        { type: "translate",
          ru: "Это дорогая сумка.",
          a: ["Das ist eine teure Tasche.", "Das ist eine teure Tasche"],
          why: "teuer → teur- + -e: eine teure Tasche. Форма teuere неправильная." },

        { type: "pairs",
          prompt: "Соедини черту характера с переводом.",
          pairs: [["ehrlich", "честный"], ["zuverlässig", "надёжный"], ["bescheiden", "скромный"], ["vorsichtig", "осторожный"], ["mutig", "смелый"], ["neugierig", "любопытный"], ["eifersüchtig", "ревнивый"], ["ordentlich", "аккуратный"]] }
      ]
    }
  ],


  /* 10 слов урока для карточек. Лексика из упражнений lehrerlenz к Lektion 18. */
  words: [
    { de: "ehrlich", ru: "честный", ex: "Ehrliche Menschen sagen immer die Wahrheit.", exru: "Честные люди всегда говорят правду." },
    { de: "zuverlässig", ru: "надёжный", ex: "Jeder braucht einen zuverlässigen Freund.", exru: "Каждому нужен надёжный друг." },
    { de: "bescheiden", ru: "скромный", ex: "Anna will nicht im Zentrum stehen, weil sie bescheiden ist.", exru: "Анна не хочет быть в центре внимания, потому что она скромная." },
    { de: "vorsichtig", ru: "осторожный", ex: "Die vorsichtigen Leute passen immer gut auf.", exru: "Осторожные люди всегда внимательны." },
    { de: "mutig", ru: "смелый", ex: "Das Land braucht mutige Männer.", exru: "Стране нужны смелые мужчины." },
    { de: "neugierig", ru: "любопытный", ex: "Viele Nachbarn sind ziemlich neugierig.", exru: "Многие соседи довольно любопытны." },
    { de: "eifersüchtig", ru: "ревнивый", ex: "Alexander ist ein eifersüchtiger Mann.", exru: "Александр — ревнивый мужчина." },
    { de: "ordentlich", ru: "аккуратный", ex: "Ein ordentliches Kind räumt immer sein Zimmer auf.", exru: "Аккуратный ребёнок всегда убирает свою комнату." },
    { de: "kariert", ru: "клетчатый, в клетку", ex: "Er trägt ein kariertes Hemd und eine karierte Mütze.", exru: "Он носит клетчатую рубашку и клетчатую кепку." },
    { de: "der Schnurrbart", ru: "усы", ex: "Asterix hat einen blonden Schnurrbart.", exru: "У Астерикса светлые усы." }
  ],

  links: [
    { t: "Grammatik: Einführung (Drag & Drop, окончание есть или нет)", url: "https://lehrerlenz.de/lektion_18_adjektivdeklination.html" },
    { t: "Grammatik: Adjektivdeklination — unbestimmter Artikel", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=329" },
    { t: "Wortschatz: Adjektive — das Gegenteil (Flashcards)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=328" },
    { t: "Übungen: Comicfiguren beschreiben (Asterix, Homer, Donald, Supermann)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=338" },
    { t: "Test: Adjektivdeklination unbestimmter Artikel", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=336" },
    { t: "Grammatik: bestimmter Artikel (LearningApps)", url: "https://learningapps.org/watch?v=p8mqxa2i220" },
    { t: "Übungen: Fragen welcher / was für ein (1)", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=343" },
    { t: "Übungen: Fragen welcher / was für ein (2) — die zwei Diebe", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=344" },
    { t: "Test: Fragen bestimmter/unbestimmter Artikel", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=335" },
    { t: "Grammatikübungen: alle Adjektivendungen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=337" },
    { t: "Millionenspiel: Adjektivdeklination", url: "https://learningapps.org/watch?v=pvb4smyg520" },
    { t: "Personenbeschreibung: James Bond", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=331" },
    { t: "Personenbeschreibung: Fehlersuche (Genially)", url: "https://view.genially.com/690373f4b3a9c14d12d96d62" }
  ]
};
