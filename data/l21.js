/* Lektion 21 — Komparation (alt, älter, am ältesten).
   Источник тем и лексики: lehrerlenz.de/lektion_21_komparation_alt_lter_am_ltesten.html */
window.L21 = {
  n: 21,
  title: "Komparation",
  ru: "Степени сравнения: älter als, so alt wie, am ältesten",

  grammar: [
    {
      title: "Три ступени: так же, больше, больше всех",
      html: `
<p>У большинства прилагательных три формы. <b>Positiv</b> — обычная, <b>Komparativ</b> — сравнение двух, <b>Superlativ</b> — рекорд в группе.</p>

<div class="matrix" style="grid-template-columns: repeat(3, 1fr)">
  <div class="cell head">Positiv</div><div class="cell head">Komparativ</div><div class="cell head">Superlativ</div>
  <div class="cell"><b>klein</b>так же: so … wie</div>
  <div class="cell hl"><b>klein<span class="end">er</span></b>+ als</div>
  <div class="cell"><b>am klein<span class="end">sten</span></b>рекорд</div>
</div>

<div class="ex"><span class="de">Mein Haus ist <b>so groß wie</b> dein Haus. Mein Haus ist <b>kleiner als</b> dein Haus. In der Stadt ist mein Haus <b>am kleinsten</b>.</span>
<span class="ru">Мой дом такой же большой, как твой. Мой дом меньше, чем твой. В городе мой дом самый маленький.</span></div>

<div class="hack">
  <span class="lbl">Хак № 1 · als — разница, wie — равенство</span>
  <div class="rhyme">anders → <span>als</span> · gleich → <span>wie</span></div>
  Есть <b>-er</b> — ставь <span class="de">als</span>. Есть <b>so … wie</b> — ставь <span class="de">wie</span>. Третьего нет.
  <span class="big">größer <u>als</u> · so groß <u>wie</u></span>
</div>

<div class="note"><b>Это главная ошибка урока.</b> <span class="de">Er ist größer <b>wie</b> ich.</span> — так иногда говорят в разговоре, но это ошибка. Правильно: <span class="de">Er ist größer <b>als</b> ich.</span></div>

<div class="hack">
  <span class="lbl">Хак № 2 · am — только без существительного</span>
  <span class="de">am schnellsten</span> стоит, когда справа ничего нет: <span class="de">Der Gepard läuft <b>am schnellsten</b>.</span>
  Если после рекорда идёт существительное — нужен артикль: <span class="de"><b>der schnellste</b> Läufer</span>.
</div>
`
    },

    {
      title: "Умлаут и лишняя -e-",
      html: `
<p>Два правила меняют форму, и оба видны на слух.</p>

<div class="hack">
  <span class="lbl">Хак № 3 · умлаут запоминаем вместе со словом</span>
  Некоторые частые односложные прилагательные с <b>a, o, u</b> получают умлаут. По одной гласной предсказать это нельзя:
  <span class="big">alt → <u>ä</u>lter · jung → j<u>ü</u>nger · groß → gr<u>ö</u>ßer</span>
  <span class="de">kalt → kälter, warm → wärmer, arm → ärmer, klug → klüger, lang → länger, kurz → kürzer, dumm → dümmer</span>
  Без a, o, u умлаута нет вовсе: <span class="de">schnell → schneller, leicht → leichter</span>. Без умлаута, например: <span class="de">voll → voller, klar → klarer, froh → froher, bunt → bunter, schlau → schlauer</span>.
</div>

<div class="cut">
  al<span class="tail">t</span> <span class="arrow">→</span> am ält<span class="tail">e</span>sten
  <small>после -t, -d, -s, -ß, -z добавь -e-, иначе не выговорить</small>
  hei<span class="tail">ß</span> <span class="arrow">→</span> am heiß<span class="tail">e</span>sten
  <small>kurz → am kürzesten · breit → am breitesten</small>
</div>

<div class="hack">
  <span class="lbl">Хак № 4 · проверка языком</span>
  Скажи вслух «am altsten» — язык спотыкается. Где спотыкается, туда и вставь <b>-e-</b>: <span class="de">am ältesten</span>.
  В Komparativ вставка не нужна: <span class="de">älter, heißer, kürzer</span>.
</div>

<div class="note"><b>Ловушка:</b> <span class="de">teuer → teurer</span>, <span class="de">dunkel → dunkler</span> — лишняя <b>-e-</b> наоборот выпадает, как в склонении из урока 18. «teuerer» — ошибка.</div>
`
    },

    {
      title: "Особые формы — пять слов наизусть",
      html: `
<p>Эти формы не выводятся из правил, их надо просто знать. Зато их всего пять, и они самые частые.</p>

<div class="scrollx">
<table class="tbl">
<tr><th>Positiv</th><th>Komparativ</th><th>Superlativ</th></tr>
<tr><td>gut</td><td class="hl"><b>besser</b></td><td>am besten</td></tr>
<tr><td>viel</td><td class="hl"><b>mehr</b></td><td>am meisten</td></tr>
<tr><td>gern</td><td class="hl"><b>lieber</b></td><td>am liebsten</td></tr>
<tr><td>hoch</td><td>höher</td><td>am <b>höchsten</b></td></tr>
<tr><td>nah</td><td>näher</td><td>am <b>nächsten</b></td></tr>
</table>
</div>

<div class="hack">
  <span class="lbl">Хак № 5 · как по-русски</span>
  Первые три ломаются так же, как в русском: хороший → <b>лучше</b>, много → <b>больше</b>, охотно → <b>охотнее</b>. Не ищи в них правила — их там нет ни на одном языке.
  <span class="big">gut – besser · viel – mehr · gern – lieber</span>
</div>

<div class="ex"><span class="de">Anna lernt <b>besser</b> als Peter. Ich habe <b>mehr</b> Fehler gemacht. Was isst du <b>am liebsten</b>?</span>
<span class="ru">Анна учится лучше Петера. Я сделал больше ошибок. Что ты любишь есть больше всего?</span></div>

<div class="note"><b>Ловушка:</b> <span class="de">gern</span> в сравнении — это «больше нравится»: <span class="de">Ich trinke <b>lieber</b> Tee als Kaffee.</span> — я больше люблю чай. «mehr gern» не бывает.</div>
`
    },

    {
      title: "Сравнение перед существительным — склоняется как обычно",
      html: `
<p>Если форма стоит перед существительным, она получает окончание по тем же таблицам, что в уроке 18. Сначала суффикс степени, потом окончание.</p>

<div class="cut">
  ein schön<span class="tail">er</span> <span class="arrow">+</span> <span class="tail">es</span> Haus <span class="arrow">→</span> ein schöneres Haus
  <small>-er степени + -es окончания</small>
</div>

<div class="ex"><span class="de">Ich habe <b>ein größeres</b> Haus, <b>einen schöneren</b> Garten und <b>eine größere</b> Garage als du.</span>
<span class="ru">У меня дом больше, сад красивее и гараж больше, чем у тебя.</span></div>

<div class="scrollx">
<table class="tbl">
<tr><th></th><th>маскулинум</th><th>нейтрум</th><th>фемининум</th><th>плюраль</th></tr>
<tr><th>Komparativ</th>
  <td class="m">einen schöner<span class="end">en</span> Garten</td>
  <td class="n">ein größer<span class="end">es</span> Haus</td>
  <td class="f">eine größer<span class="end">e</span> Garage</td>
  <td class="p">länger<span class="end">e</span> Haare</td></tr>
<tr><th>Superlativ</th>
  <td class="m">der best<span class="end">e</span> Test</td>
  <td class="n">das teuerst<span class="end">e</span> Hotel</td>
  <td class="f">die schlechtest<span class="end">e</span> Schrift</td>
  <td class="p">die meist<span class="end">en</span> Fehler</td></tr>
</table>
</div>

<div class="hack">
  <span class="lbl">Хак № 6 · рекорд бывает только один</span>
  Рекорд один, его уже знают, поэтому Superlativ перед существительным не бывает с <span class="de">ein</span> — только с <span class="de">der/die/das</span> или притяжательным.
  <span class="big">der beste Test · das höchste Haus · mein bester Freund</span>
  «ein bester» не бывает.
</div>

<div class="hack">
  <span class="lbl">Хак № 7 · mehr и weniger не склоняются</span>
  <span class="de">Ich habe <b>mehr</b> Zeit. Wir haben <b>mehr</b> Probleme. Er macht <b>weniger</b> Fehler.</span>
  Никаких «mehre», «mehrer». (<span class="de">mehrere</span> — другое слово: «несколько».)
</div>
`
    }
  ],

  days: [
    {
      title: "Формы: -er, am -sten, умлаут",
      sub: "älter, am ältesten, schneller, am schnellsten",
      grammar: [0, 1],
      ex: [
        { type: "choice",
          q: "Mein Bruder ist zwei Jahre ___ als ich.",
          opts: ["jünger", "junger", "jüngerer"], a: 0,
          ru: "Мой брат на два года младше меня.",
          why: "Короткое слово с u получает умлаут: jung → jünger. После ist существительного нет — окончания тоже нет." },

        { type: "choice",
          q: "Im Winter ist es ___ als im Sommer.",
          opts: ["kälter", "kalter", "mehr kalt"], a: 0,
          ru: "Зимой холоднее, чем летом.",
          why: "kalt → kälter: умлаут у короткого слова с a. «mehr kalt» по-немецки не говорят." },

        { type: "fill", full: true,
          q: "Anna läuft {schnell} als Peter.",
          a: ["schneller"],
          ru: "Анна бегает быстрее Петера.",
          why: "Komparativ: -er. Умлаута нет — в schnell нет a, o, u." },

        { type: "fill", full: true,
          q: "Der Gepard läuft am {schnell}.",
          a: ["schnellsten"],
          ru: "Гепард бегает быстрее всех.",
          why: "Рекорд без существительного: am + -sten." },

        { type: "fill", full: true,
          q: "Das Kleid ist {teuer} als die Hose.",
          a: ["teurer"],
          ru: "Платье дороже брюк.",
          why: "teuer теряет -e- в основе: teurer. «teuerer» — ошибка." },

        { type: "choice",
          q: "Heute ist der ___ Tag des Jahres.",
          opts: ["heißeste", "heißte", "heißste"], a: 0,
          ru: "Сегодня самый жаркий день года.",
          why: "После ß не выговорить -st-, поэтому вставляется -e-: heißeste." },

        { type: "fill", full: true,
          q: "Ali ist in der Klasse am {groß}.",
          a: ["größten"],
          ru: "Али самый высокий в классе.",
          why: "groß → größer → am größten: умлаут, а -e- после ß здесь не вставляют, это исключение." },

        { type: "fill", full: true,
          q: "Mein Opa ist in unserer Familie am {alt}.",
          a: ["ältesten"],
          ru: "Мой дедушка самый старший в нашей семье.",
          why: "Умлаут плюс -e- после t: am ältesten." },

        { type: "choice",
          prompt: "Какое из слов НЕ получает умлаут в сравнении?",
          q: "schnell · alt · jung",
          opts: ["schnell", "alt", "jung"], a: 0,
          why: "Умлаут бывает только у a, o, u. В schnell гласная e — schneller без точек." },

        { type: "fill", full: true,
          q: "Das war der {dumm} Fehler von allen.",
          a: ["dümmste"],
          ru: "Это была самая глупая ошибка из всех.",
          why: "dumm → dümmer → der dümmste: умлаут и окончание -e после der." },

        { type: "fill", full: true,
          q: "Wo ist es im Winter am {warm}? — Im Süden.",
          a: ["wärmsten"],
          ru: "Где зимой теплее всего? — На юге.",
          why: "warm → wärmer → am wärmsten." },

        { type: "fill", full: true,
          q: "Der Stuhl ist {leicht} als der Tisch.",
          a: ["leichter"],
          ru: "Стул легче стола.",
          why: "leicht → leichter: в слове нет a, o, u, поэтому и умлаута нет." },

        { type: "pairs",
          prompt: "Соедини обычную форму с рекордом.",
          pairs: [["alt", "am ältesten"], ["jung", "am jüngsten"], ["kalt", "am kältesten"], ["klug", "am klügsten"], ["kurz", "am kürzesten"], ["heiß", "am heißesten"]] },

        { type: "translate",
          ru: "Мой брат старше меня.",
          a: ["Mein Bruder ist älter als ich."],
          why: "Разница — als. alt → älter." },

        { type: "translate",
          ru: "Летом дни длиннее, чем зимой.",
          a: ["Im Sommer sind die Tage länger als im Winter.", "Die Tage sind im Sommer länger als im Winter."],
          why: "lang → länger, разница — als." }
      ]
    },

    {
      title: "als, wie, am и особые формы",
      sub: "besser, mehr, lieber — и где als, а где wie",
      grammar: [0, 2],
      ex: [
        { type: "choice",
          q: "Ich esse lieber zu Hause ___ im Restaurant.",
          opts: ["als", "wie", "am"], a: 0,
          ru: "Я больше люблю есть дома, чем в ресторане.",
          why: "lieber — сравнительная форма, значит разница: als." },

        { type: "choice",
          q: "Das Essen schmeckt nirgends so gut ___ zu Hause.",
          opts: ["wie", "als", "am"], a: 0,
          ru: "Нигде еда не такая вкусная, как дома.",
          why: "so gut … wie — равенство, значит wie." },

        { type: "choice",
          q: "Zu Hause schmeckt das Essen ___ besten.",
          opts: ["am", "als", "wie"], a: 0,
          ru: "Дома еда вкуснее всего.",
          why: "Рекорд без существительного: am besten." },

        { type: "fill",
          q: "Was isst du am {gern}?",
          a: ["liebsten"],
          ru: "Что ты любишь есть больше всего?",
          why: "gern — особая форма: lieber, am liebsten." },

        { type: "fill",
          q: "Anna lernt {gut} als Peter.",
          a: ["besser"],
          ru: "Анна учится лучше Петера.",
          why: "gut → besser → am besten. Выучить, правилом не выводится." },

        { type: "fill",
          q: "Ich habe {viel} Fehler als mein Freund gemacht.",
          a: ["mehr"],
          ru: "Я сделал больше ошибок, чем мой друг.",
          why: "viel → mehr, и mehr никогда не склоняется." },

        { type: "choice",
          q: "Peter ist größer ___ Anna.",
          opts: ["als", "wie"], a: 0,
          ru: "Петер выше Анны.",
          why: "Главная ловушка урока: после -er только als. «größer wie» — разговорная ошибка." },

        { type: "fill",
          q: "Das Ulmer Münster hat den {hoch} Kirchturm der Welt.",
          a: ["höchsten"],
          ru: "У Ульмского собора самая высокая колокольня в мире.",
          why: "hoch → höher → der höchste; den Kirchturm — Akkusativ мужского рода, окончание -en." },

        { type: "fill",
          q: "Wir wohnen jetzt {nah} am Zentrum als früher.",
          a: ["näher"],
          ru: "Теперь мы живём ближе к центру, чем раньше.",
          why: "nah → näher → am nächsten: особая форма." },

        { type: "choice",
          q: "Vertrauen ist gut, aber Kontrolle ist ___ .",
          opts: ["besser", "am besten", "gut"], a: 0,
          ru: "Доверие — хорошо, а контроль — лучше.",
          why: "Сравниваются двое — доверие и контроль: besser." },

        { type: "fill",
          q: "Das Restaurant ist doppelt so teuer {} die Pizzeria.",
          a: ["wie"],
          ru: "Ресторан вдвое дороже пиццерии.",
          why: "doppelt so … wie — конструкция с so, значит wie, хотя по смыслу это разница." },

        { type: "choice",
          prompt: "Что значит то же самое?",
          q: "Ich bezahle höchstens 2000 Euro.",
          opts: ["Ich bezahle nicht mehr als 2000 Euro.", "Ich bezahle nicht weniger als 2000 Euro.", "Ich bezahle mehr als 2000 Euro."], a: 0,
          ru: "Я заплачу максимум 2000 евро.",
          why: "höchstens — «самое большее», то есть не больше чем." },

        { type: "pairs",
          prompt: "Соедини обычную форму со сравнительной.",
          pairs: [["gut", "besser"], ["viel", "mehr"], ["gern", "lieber"], ["hoch", "höher"], ["nah", "näher"], ["groß", "größer"]] },

        { type: "translate",
          ru: "Я больше всего люблю пиццу.",
          a: ["Ich esse am liebsten Pizza.", "Am liebsten esse ich Pizza.", "Ich mag Pizza am liebsten.", "Pizza esse ich am liebsten."],
          why: "gern → am liebsten: «больше всего нравится»." },

        { type: "translate",
          ru: "Он такой же высокий, как его отец.",
          a: ["Er ist so groß wie sein Vater.", "Er ist genauso groß wie sein Vater."],
          why: "Равенство: so … wie." },

        { type: "translate",
          ru: "Лучше всего учиться утром.",
          a: ["Man lernt am besten morgens.", "Am besten lernt man morgens.", "Morgens lernt man am besten.", "Am besten lernt man am Morgen."],
          why: "gut → am besten, без существительного — с am." }
      ]
    },

    {
      title: "Сравнение перед существительным",
      sub: "ein größeres Haus, der beste Test, mehr без окончания",
      grammar: [3],
      ex: [
        { type: "choice",
          q: "Ali ist ___ Schüler in der Klasse.",
          opts: ["der größte", "der größter", "am größten"], a: 0,
          ru: "Али — самый высокий ученик в классе.",
          why: "После рекорда стоит существительное — нужен артикль: der größte. am größten — только без существительного." },

        { type: "choice",
          q: "Ich habe ___ Haus als du.",
          opts: ["ein größeres", "ein größer", "einen größeren"], a: 0,
          ru: "У меня дом больше, чем у тебя.",
          why: "das Haus после ein — хвост от das: größer + es." },

        { type: "choice",
          q: "Otto hat einen ___ Bauch als Bernd.",
          opts: ["größeren", "größerer", "größere"], a: 0,
          ru: "У Отто живот больше, чем у Бернда.",
          why: "der Bauch в Akkusativ после einen → -en: größeren." },

        { type: "fill",
          q: "Bernd hat {größer} Füße als Otto.",
          a: ["größere"],
          ru: "У Бернда ноги больше, чем у Отто.",
          why: "Füße — множественное без артикля, Akkusativ → -e." },

        { type: "fill",
          q: "Tamerlan hat die {schlechtest} Schrift in der Klasse.",
          a: ["schlechteste"],
          ru: "У Тамерлана самый плохой почерк в классе.",
          why: "die Schrift, после die → -e: die schlechteste." },

        { type: "fill",
          q: "Er macht die {meist} Fehler.",
          a: ["meisten"],
          ru: "Он делает больше всех ошибок.",
          why: "die Fehler — множественное, после артикля -en: die meisten." },

        { type: "choice",
          q: "Ich habe ___ Zeit als du.",
          opts: ["mehr", "mehre", "mehrere"], a: 0,
          ru: "У меня больше времени, чем у тебя.",
          why: "mehr не склоняется никогда. mehrere — другое слово: «несколько»." },

        { type: "fill",
          q: "Mädchen haben meistens {länger} Haare als Jungen.",
          a: ["längere"],
          ru: "У девочек обычно волосы длиннее, чем у мальчиков.",
          why: "Haare без артикля во множественном → -e." },

        { type: "fill",
          q: "Ich habe einen {schöner} Garten als du.",
          a: ["schöneren"],
          ru: "У меня сад красивее, чем у тебя.",
          why: "der Garten, Akkusativ после einen → -en: schöner + en." },

        { type: "choice",
          q: "Das ist ___ Test von allen.",
          opts: ["der beste", "am besten", "der besten"], a: 0,
          ru: "Это лучший тест из всех.",
          why: "Существительное Test стоит рядом — der beste, Nominativ мужского рода → -e." },

        { type: "fill",
          q: "Anna schreibt immer den {best} Test.",
          a: ["besten"],
          ru: "Анна всегда пишет тест лучше всех.",
          why: "den Test — Akkusativ мужского рода, после den → -en." },

        { type: "fill",
          q: "Der 21. Juni ist der {lang} Tag im Jahr.",
          a: ["längste"],
          ru: "21 июня — самый длинный день в году.",
          why: "lang → längste: умлаут, и после der → -e." },

        { type: "fill",
          q: "Herr Müller hat ein {größer} Auto als sein Bruder.",
          a: ["größeres"],
          ru: "У господина Мюллера машина больше, чем у его брата.",
          why: "das Auto после ein — хвост от das: -es." },

        { type: "translate",
          ru: "Это самый дорогой отель в Германии.",
          a: ["Das ist das teuerste Hotel in Deutschland."],
          why: "Рекорд перед существительным — с определённым артиклем: das teuerste." },

        { type: "translate",
          ru: "У меня машина быстрее, чем у тебя.",
          a: ["Ich habe ein schnelleres Auto als du.", "Mein Auto ist schneller als dein Auto.", "Mein Auto ist schneller als deins."],
          why: "ein schnelleres Auto: -er степени плюс -es по роду." },

        { type: "translate",
          ru: "Он лучший игрок в команде.",
          a: ["Er ist der beste Spieler in der Mannschaft.", "Er ist der beste Spieler im Team.", "Er ist der beste Spieler der Mannschaft."],
          why: "der beste Spieler — рекорд с артиклем и окончанием -e." }
      ]
    },

    {
      title: "Рекорды: Германия, животные, времена года",
      sub: "Всё вместе в текстах",
      grammar: [0, 1, 2, 3],
      ex: [
        { type: "choice",
          q: "Das Ulmer Münster ist 161 m hoch. Das ist der ___ Kirchturm der Welt.",
          opts: ["höchste", "hochste", "höhere"], a: 0,
          ru: "Ульмский собор высотой 161 метр. Это самая высокая колокольня в мире.",
          why: "Рекорд: hoch → der höchste. höhere — сравнение двух, а тут весь мир." },

        { type: "choice",
          q: "Der Bodensee ist bis zu 250 m tief und damit der ___ See in Deutschland.",
          opts: ["tiefste", "tiefeste", "tiefer"], a: 0,
          ru: "Боденское озеро глубиной до 250 метров — самое глубокое в Германии.",
          why: "После f вставка -e- не нужна: tiefste." },

        { type: "fill", full: true,
          q: "Diese Brücke ist 800 m lang und damit die {lang} in Deutschland.",
          a: ["längste"],
          ru: "Этот мост длиной 800 метров — самый длинный в Германии.",
          why: "die Brücke, рекорд с артиклем: die längste." },

        { type: "fill", full: true,
          q: "Am Funtensee hat man −45,9 Grad gemessen. Er ist der {kalt} Ort in Deutschland.",
          a: ["kälteste"],
          ru: "На озере Фунтензее намерили −45,9 градуса. Это самое холодное место в Германии.",
          why: "Умлаут и -e- после t: kälteste." },

        { type: "fill", full: true,
          q: "Der Flughafen Frankfurt ist am {groß}.",
          a: ["größten"],
          ru: "Франкфуртский аэропорт самый большой.",
          why: "Без существительного — am größten." },

        { type: "choice",
          q: "Im Sommer sind die Tage ___ als im Winter.",
          opts: ["länger", "langer", "am längsten"], a: 0,
          ru: "Летом дни длиннее, чем зимой.",
          why: "Сравниваются два сезона — Komparativ с als." },

        { type: "fill", full: true,
          q: "Am 21. Juni steht die Sonne am {hoch}.",
          a: ["höchsten"],
          ru: "21 июня солнце стоит выше всего.",
          why: "hoch → am höchsten: особая форма." },

        { type: "fill", full: true,
          q: "Der 21. Dezember ist der {kurz} Tag im Jahr.",
          a: ["kürzeste"],
          ru: "21 декабря — самый короткий день в году.",
          why: "kurz → kürzer → der kürzeste: умлаут и -e- после z." },

        { type: "choice",
          q: "Im Vergleich zu anderen Tieren läuft der Mensch viel ___ .",
          opts: ["langsamer", "langsam", "am langsamsten"], a: 0,
          ru: "По сравнению с другими животными человек бегает намного медленнее.",
          why: "viel + Komparativ — «намного медленнее»." },

        { type: "fill", full: true,
          q: "Der Gepard läuft noch {schnell} als ein Windhund.",
          a: ["schneller"],
          ru: "Гепард бегает ещё быстрее борзой.",
          why: "noch + Komparativ — «ещё быстрее», дальше als." },

        { type: "fill", full: true,
          q: "In der Luft ist der Wanderfalke am {schnell}.",
          a: ["schnellsten"],
          ru: "В воздухе быстрее всех сапсан.",
          why: "Рекорд без существительного: am schnellsten." },

        { type: "choice",
          q: "Auf der Autobahn kann man am ___ fahren.",
          opts: ["schnellsten", "schneller", "schnellste"], a: 0,
          ru: "Быстрее всего можно ездить по автобану.",
          why: "am + -sten, без окончания рода." },

        { type: "pairs",
          prompt: "Соедини футбольное слово с переводом.",
          pairs: [["der Torwart", "вратарь"], ["der Schiedsrichter", "судья"], ["die Mannschaft", "команда"], ["der Zuschauer", "зритель"], ["der Elfmeter", "пенальти"], ["das Trikot", "игровая футболка"]] },

        { type: "translate",
          ru: "Это самое высокое здание в городе.",
          a: ["Das ist das höchste Gebäude in der Stadt.", "Das ist das höchste Haus in der Stadt."],
          why: "hoch → das höchste, рекорд с определённым артиклем." },

        { type: "translate",
          ru: "«Бавария» — лучшая команда.",
          a: ["Bayern ist die beste Mannschaft.", "Bayern München ist die beste Mannschaft.", "Bayern ist das beste Team."],
          why: "die Mannschaft, рекорд: die beste." },

        { type: "translate",
          ru: "Зимой холоднее, чем осенью.",
          a: ["Im Winter ist es kälter als im Herbst.", "Es ist im Winter kälter als im Herbst."],
          why: "kalt → kälter, разница — als." }
      ]
    }
  ],

  /* 10 слов урока для карточек: спорт и рекорды из упражнений lehrerlenz к Lektion 21. */
  words: [
    { de: "der Rekord", ru: "рекорд", ex: "Er hat einen neuen Rekord aufgestellt.", exru: "Он установил новый рекорд." },
    { de: "die Mannschaft", ru: "команда", ex: "Unsere Mannschaft hat gewonnen.", exru: "Наша команда выиграла." },
    { de: "der Schiedsrichter", ru: "судья (в спорте)", ex: "Der Schiedsrichter pfeift das Spiel ab.", exru: "Судья даёт свисток об окончании игры." },
    { de: "der Torwart", ru: "вратарь", ex: "Der Torwart hat den Elfmeter gehalten.", exru: "Вратарь отбил пенальти." },
    { de: "der Zuschauer", ru: "зритель", ex: "Im Stadion sind 50 000 Zuschauer.", exru: "На стадионе 50 000 зрителей." },
    { de: "die Verletzung", ru: "травма", ex: "Wegen einer Verletzung kann er nicht spielen.", exru: "Из-за травмы он не может играть." },
    { de: "der Wettkampf", ru: "соревнование", ex: "Morgen haben wir einen wichtigen Wettkampf.", exru: "Завтра у нас важное соревнование." },
    { de: "gewinnen", ru: "выигрывать", ex: "Wer hat das Spiel gewonnen?", exru: "Кто выиграл игру?" },
    { de: "verlieren", ru: "проигрывать, терять", ex: "Wir haben knapp verloren.", exru: "Мы проиграли с минимальным счётом." },
    { de: "höchstens", ru: "максимум, самое большее", ex: "Ich bleibe höchstens eine Stunde.", exru: "Я останусь максимум на час." }
  ],

  links: [
    { t: "Wir vergleichen — Einführung (Genially)", url: "https://view.genially.com/6a4288cc49bf158b51df03ab" },
    { t: "Grammatik: Einführung", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=386" },
    { t: "Komparation — Formen lernen", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=387" },
    { t: "gut — besser — am besten", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=393" },
    { t: "Rekorde bei den Tieren", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=398" },
    { t: "Rekorde in Deutschland", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=390" },
    { t: "Rekorde auf der Erde", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=397" },
    { t: "Wie sagt man?", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=392" },
    { t: "die Jahreszeiten", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=388" },
    { t: "Thema: Fußball", url: "https://lehrerlenz.de/wordpress/wp-admin/admin-ajax.php?action=h5p_embed&id=389" },
    { t: "Rekorde in unserer Klasse (LearningApps)", url: "https://learningapps.org/watch?v=piih3vo1518" }
  ]
};
