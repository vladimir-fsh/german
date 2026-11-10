/* Первые 90 фраз из беседы пользователя, ещё 50 авторских бытовых фраз.
   Старые id сохранены. Источник первых 90: https://chatgpt.com/share/6af36a68-ced4-83eb-a0a0-9f31e3f7c628 */
window.PHRASE_TOPICS = [
  {
    "id": "family",
    "title": "Семья и детский сад"
  },
  {
    "id": "shopping",
    "title": "Покупки и посылки"
  },
  {
    "id": "health",
    "title": "Здоровье и аптека"
  },
  {
    "id": "food",
    "title": "Еда и кафе"
  },
  {
    "id": "travel",
    "title": "Транспорт и дорога"
  },
  {
    "id": "car",
    "title": "Автомобиль"
  },
  {
    "id": "home",
    "title": "Дом и соседи"
  },
  {
    "id": "work",
    "title": "Работа"
  },
  {
    "id": "services",
    "title": "Документы и услуги"
  },
  {
    "id": "conversation",
    "title": "Общение и мнение"
  }
];
window.PHRASES = [
  {
    "id": "s01-1",
    "situation": 1,
    "title": "Перенести встречу в Kita",
    "context": "Во вторник работаешь, предлагаешь четверг.",
    "de": "Leider kann ich am Dienstag nicht kommen, weil ich arbeiten muss.",
    "ru": "К сожалению, я не могу прийти во вторник, потому что мне нужно работать.",
    "topic": "family"
  },
  {
    "id": "s01-2",
    "situation": 1,
    "title": "Перенести встречу в Kita",
    "context": "Во вторник работаешь, предлагаешь четверг.",
    "de": "Am Donnerstag würde es mir besser passen.",
    "ru": "В четверг мне было бы удобнее.",
    "topic": "family"
  },
  {
    "id": "s01-3",
    "situation": 1,
    "title": "Перенести встречу в Kita",
    "context": "Во вторник работаешь, предлагаешь четверг.",
    "de": "Wäre das möglich?",
    "ru": "Это было бы возможно?",
    "topic": "family"
  },
  {
    "id": "s02-1",
    "situation": 2,
    "title": "Договориться о самовывозе",
    "context": "Сегодня укладываешь ребёнка, покупатель может приехать завтра.",
    "de": "Heute Abend geht es leider nicht, weil ich mein Kind ins Bett bringe.",
    "ru": "Сегодня вечером, к сожалению, не получится, потому что я укладываю ребёнка спать.",
    "topic": "shopping"
  },
  {
    "id": "s02-2",
    "situation": 2,
    "title": "Договориться о самовывозе",
    "context": "Сегодня укладываешь ребёнка, покупатель может приехать завтра.",
    "de": "Morgen können Sie zwischen siebzehn und neunzehn Uhr vorbeikommen.",
    "ru": "Завтра Вы можете приехать между семнадцатью и девятнадцатью часами.",
    "topic": "shopping"
  },
  {
    "id": "s02-3",
    "situation": 2,
    "title": "Договориться о самовывозе",
    "context": "Сегодня укладываешь ребёнка, покупатель может приехать завтра.",
    "de": "Bitte schreiben Sie mir eine halbe Stunde vorher.",
    "ru": "Пожалуйста, напишите мне за полчаса до приезда.",
    "topic": "shopping"
  },
  {
    "id": "s03-1",
    "situation": 3,
    "title": "Сообщить в Kita об отсутствии ребёнка",
    "context": "Дочка заболела и останется дома.",
    "de": "Meine Tochter kommt heute nicht in die Kita.",
    "ru": "Моя дочь сегодня не придёт в детский сад.",
    "topic": "family"
  },
  {
    "id": "s03-2",
    "situation": 3,
    "title": "Сообщить в Kita об отсутствии ребёнка",
    "context": "Дочка заболела и останется дома.",
    "de": "Sie bleibt zu Hause, weil sie krank ist.",
    "ru": "Она останется дома, потому что заболела.",
    "topic": "family"
  },
  {
    "id": "s03-3",
    "situation": 3,
    "title": "Сообщить в Kita об отсутствии ребёнка",
    "context": "Дочка заболела и останется дома.",
    "de": "Ich melde mich morgen noch einmal.",
    "ru": "Я ещё раз свяжусь с вами завтра.",
    "topic": "family"
  },
  {
    "id": "s04-1",
    "situation": 4,
    "title": "Забрать ребёнка раньше",
    "context": "У вас запись к врачу.",
    "de": "Ich möchte meine Tochter heute früher abholen.",
    "ru": "Я хочу сегодня забрать дочь пораньше.",
    "topic": "family"
  },
  {
    "id": "s04-2",
    "situation": 4,
    "title": "Забрать ребёнка раньше",
    "context": "У вас запись к врачу.",
    "de": "Wir haben um drei Uhr einen Arzttermin.",
    "ru": "У нас приём у врача в три часа.",
    "topic": "family"
  },
  {
    "id": "s04-3",
    "situation": 4,
    "title": "Забрать ребёнка раньше",
    "context": "У вас запись к врачу.",
    "de": "Ich komme schon um halb drei.",
    "ru": "Я приду уже в половине третьего.",
    "topic": "family"
  },
  {
    "id": "s05-1",
    "situation": 5,
    "title": "Записаться к врачу по телефону",
    "context": "Нужен приём, лучше утром.",
    "de": "Ich möchte einen Termin vereinbaren.",
    "ru": "Я хочу записаться на приём.",
    "topic": "health"
  },
  {
    "id": "s05-2",
    "situation": 5,
    "title": "Записаться к врачу по телефону",
    "context": "Нужен приём, лучше утром.",
    "de": "Haben Sie diese Woche noch einen Termin frei?",
    "ru": "У Вас ещё есть свободное время для приёма на этой неделе?",
    "topic": "health"
  },
  {
    "id": "s05-3",
    "situation": 5,
    "title": "Записаться к врачу по телефону",
    "context": "Нужен приём, лучше утром.",
    "de": "Vormittags passt es mir am besten.",
    "ru": "До обеда мне удобнее всего.",
    "topic": "health"
  },
  {
    "id": "s06-1",
    "situation": 6,
    "title": "Объяснить врачу, что болит",
    "context": "Болит спина, особенно после долгого сидения.",
    "de": "Ich habe seit einiger Zeit Rückenschmerzen.",
    "ru": "У меня уже некоторое время болит спина.",
    "topic": "health"
  },
  {
    "id": "s06-2",
    "situation": 6,
    "title": "Объяснить врачу, что болит",
    "context": "Болит спина, особенно после долгого сидения.",
    "de": "Besonders nach langem Sitzen tut mein Rücken weh.",
    "ru": "Особенно после долгого сидения у меня болит спина.",
    "topic": "health"
  },
  {
    "id": "s06-3",
    "situation": 6,
    "title": "Объяснить врачу, что болит",
    "context": "Болит спина, особенно после долгого сидения.",
    "de": "Können Sie sich das bitte ansehen?",
    "ru": "Вы можете, пожалуйста, это осмотреть?",
    "topic": "health"
  },
  {
    "id": "s07-1",
    "situation": 7,
    "title": "Попросить помощи в аптеке",
    "context": "Нужно средство от боли в горле.",
    "de": "Ich hätte gern etwas gegen Halsschmerzen.",
    "ru": "Я хотел бы что-нибудь от боли в горле.",
    "topic": "health"
  },
  {
    "id": "s07-2",
    "situation": 7,
    "title": "Попросить помощи в аптеке",
    "context": "Нужно средство от боли в горле.",
    "de": "Wie oft soll ich das nehmen?",
    "ru": "Как часто мне это принимать?",
    "topic": "health"
  },
  {
    "id": "s07-3",
    "situation": 7,
    "title": "Попросить помощи в аптеке",
    "context": "Нужно средство от боли в горле.",
    "de": "Muss ich dabei etwas beachten?",
    "ru": "Мне нужно при этом что-нибудь учитывать?",
    "topic": "health"
  },
  {
    "id": "s08-1",
    "situation": 8,
    "title": "Найти товар в супермаркете",
    "context": "Ищешь овсяное молоко без сахара.",
    "de": "Entschuldigung, wo finde ich die Hafermilch?",
    "ru": "Извините, где найти овсяное молоко?",
    "topic": "food"
  },
  {
    "id": "s08-2",
    "situation": 8,
    "title": "Найти товар в супермаркете",
    "context": "Ищешь овсяное молоко без сахара.",
    "de": "Gibt es die auch ohne Zucker?",
    "ru": "Оно есть и без сахара?",
    "topic": "food"
  },
  {
    "id": "s08-3",
    "situation": 8,
    "title": "Найти товар в супермаркете",
    "context": "Ищешь овсяное молоко без сахара.",
    "de": "Vielen Dank für Ihre Hilfe.",
    "ru": "Большое спасибо за Вашу помощь.",
    "topic": "food"
  },
  {
    "id": "s09-1",
    "situation": 9,
    "title": "Заказать в пекарне",
    "context": "Покупаешь булочки и кофе с собой.",
    "de": "Ich hätte gern zwei Brötchen.",
    "ru": "Я хотел бы две булочки.",
    "topic": "food"
  },
  {
    "id": "s09-2",
    "situation": 9,
    "title": "Заказать в пекарне",
    "context": "Покупаешь булочки и кофе с собой.",
    "de": "Dazu nehme ich einen kleinen Kaffee mit Milch.",
    "ru": "К этому я возьму маленький кофе с молоком.",
    "topic": "food"
  },
  {
    "id": "s09-3",
    "situation": 9,
    "title": "Заказать в пекарне",
    "context": "Покупаешь булочки и кофе с собой.",
    "de": "Alles zum Mitnehmen, bitte.",
    "ru": "Всё с собой, пожалуйста.",
    "topic": "food"
  },
  {
    "id": "s10-1",
    "situation": 10,
    "title": "Уточнить состав блюда",
    "context": "Выбираешь неострое блюдо для ребёнка.",
    "de": "Ist dieses Gericht scharf?",
    "ru": "Это блюдо острое?",
    "topic": "food"
  },
  {
    "id": "s10-2",
    "situation": 10,
    "title": "Уточнить состав блюда",
    "context": "Выбираешь неострое блюдо для ребёнка.",
    "de": "Meine Tochter isst nicht gern scharf.",
    "ru": "Моя дочь не любит острую еду.",
    "topic": "food"
  },
  {
    "id": "s10-3",
    "situation": 10,
    "title": "Уточнить состав блюда",
    "context": "Выбираешь неострое блюдо для ребёнка.",
    "de": "Können Sie die Soße bitte extra bringen?",
    "ru": "Можете принести соус отдельно, пожалуйста?",
    "topic": "food"
  },
  {
    "id": "s11-1",
    "situation": 11,
    "title": "Обменять одежду",
    "context": "Купил ребёнку слишком маленькую куртку.",
    "de": "Ich habe diese Jacke gestern gekauft.",
    "ru": "Я купил эту куртку вчера.",
    "topic": "shopping"
  },
  {
    "id": "s11-2",
    "situation": 11,
    "title": "Обменять одежду",
    "context": "Купил ребёнку слишком маленькую куртку.",
    "de": "Sie ist meiner Tochter leider zu klein.",
    "ru": "Она, к сожалению, слишком мала моей дочери.",
    "topic": "shopping"
  },
  {
    "id": "s11-3",
    "situation": 11,
    "title": "Обменять одежду",
    "context": "Купил ребёнку слишком маленькую куртку.",
    "de": "Kann ich sie gegen eine größere umtauschen?",
    "ru": "Можно обменять её на куртку побольше?",
    "topic": "shopping"
  },
  {
    "id": "s12-1",
    "situation": 12,
    "title": "Получить посылку",
    "context": "Пришёл в пункт выдачи с уведомлением.",
    "de": "Ich möchte ein Paket abholen.",
    "ru": "Я хочу забрать посылку.",
    "topic": "shopping"
  },
  {
    "id": "s12-2",
    "situation": 12,
    "title": "Получить посылку",
    "context": "Пришёл в пункт выдачи с уведомлением.",
    "de": "Hier sind die Benachrichtigung und mein Ausweis.",
    "ru": "Вот уведомление и моё удостоверение личности.",
    "topic": "shopping"
  },
  {
    "id": "s12-3",
    "situation": 12,
    "title": "Получить посылку",
    "context": "Пришёл в пункт выдачи с уведомлением.",
    "de": "Brauchen Sie noch etwas?",
    "ru": "Вам нужно ещё что-нибудь?",
    "topic": "shopping"
  },
  {
    "id": "s13-1",
    "situation": 13,
    "title": "Уточнить дорогу",
    "context": "Ищешь остановку и хочешь понять, далеко ли идти.",
    "de": "Entschuldigung, wie komme ich zur nächsten Bushaltestelle?",
    "ru": "Извините, как пройти к ближайшей автобусной остановке?",
    "topic": "travel"
  },
  {
    "id": "s13-2",
    "situation": 13,
    "title": "Уточнить дорогу",
    "context": "Ищешь остановку и хочешь понять, далеко ли идти.",
    "de": "Kann ich zu Fuß dorthin gehen?",
    "ru": "Туда можно дойти пешком?",
    "topic": "travel"
  },
  {
    "id": "s13-3",
    "situation": 13,
    "title": "Уточнить дорогу",
    "context": "Ищешь остановку и хочешь понять, далеко ли идти.",
    "de": "Wie lange dauert das ungefähr?",
    "ru": "Сколько примерно это займёт времени?",
    "topic": "travel"
  },
  {
    "id": "s14-1",
    "situation": 14,
    "title": "Купить билет",
    "context": "Едешь в Берлин и берёшь велосипед.",
    "de": "Ich brauche eine Fahrkarte nach Berlin.",
    "ru": "Мне нужен билет до Берлина.",
    "topic": "travel"
  },
  {
    "id": "s14-2",
    "situation": 14,
    "title": "Купить билет",
    "context": "Едешь в Берлин и берёшь велосипед.",
    "de": "Ich möchte mein Fahrrad mitnehmen.",
    "ru": "Я хочу взять с собой велосипед.",
    "topic": "travel"
  },
  {
    "id": "s14-3",
    "situation": 14,
    "title": "Купить билет",
    "context": "Едешь в Берлин и берёшь велосипед.",
    "de": "Welches Ticket brauche ich dafür?",
    "ru": "Какой билет мне для этого нужен?",
    "topic": "travel"
  },
  {
    "id": "s15-1",
    "situation": 15,
    "title": "Сообщить об опоздании",
    "context": "Поезд задерживается, опоздаешь на встречу.",
    "de": "Mein Zug hat leider Verspätung.",
    "ru": "Мой поезд, к сожалению, задерживается.",
    "topic": "travel"
  },
  {
    "id": "s15-2",
    "situation": 15,
    "title": "Сообщить об опоздании",
    "context": "Поезд задерживается, опоздаешь на встречу.",
    "de": "Ich komme ungefähr zwanzig Minuten später.",
    "ru": "Я приеду примерно на двадцать минут позже.",
    "topic": "travel"
  },
  {
    "id": "s15-3",
    "situation": 15,
    "title": "Сообщить об опоздании",
    "context": "Поезд задерживается, опоздаешь на встречу.",
    "de": "Können Sie bitte auf mich warten?",
    "ru": "Вы можете, пожалуйста, меня подождать?",
    "topic": "travel"
  },
  {
    "id": "s16-1",
    "situation": 16,
    "title": "Записаться на замену колёс",
    "context": "Хочешь узнать время и стоимость.",
    "de": "Ich möchte einen Termin zum Radwechsel vereinbaren.",
    "ru": "Я хочу записаться на замену колёс.",
    "topic": "car"
  },
  {
    "id": "s16-2",
    "situation": 16,
    "title": "Записаться на замену колёс",
    "context": "Хочешь узнать время и стоимость.",
    "de": "Wie viel kostet das bei Ihnen?",
    "ru": "Сколько это у Вас стоит?",
    "topic": "car"
  },
  {
    "id": "s16-3",
    "situation": 16,
    "title": "Записаться на замену колёс",
    "context": "Хочешь узнать время и стоимость.",
    "de": "Kann ich währenddessen hier warten?",
    "ru": "Можно мне подождать здесь, пока это делают?",
    "topic": "car"
  },
  {
    "id": "s17-1",
    "situation": 17,
    "title": "Описать неисправность автомобиля",
    "context": "При езде слышен звук сзади.",
    "de": "Während der Fahrt höre ich hinten ein Geräusch.",
    "ru": "Во время езды я слышу сзади какой-то звук.",
    "topic": "car"
  },
  {
    "id": "s17-2",
    "situation": 17,
    "title": "Описать неисправность автомобиля",
    "context": "При езде слышен звук сзади.",
    "de": "Auf unebenen Straßen wird es lauter.",
    "ru": "На неровных дорогах он становится громче.",
    "topic": "car"
  },
  {
    "id": "s17-3",
    "situation": 17,
    "title": "Описать неисправность автомобиля",
    "context": "При езде слышен звук сзади.",
    "de": "Könnten Sie das bitte überprüfen?",
    "ru": "Вы не могли бы это проверить?",
    "topic": "car"
  },
  {
    "id": "s18-1",
    "situation": 18,
    "title": "Сообщить арендодателю о проблеме",
    "context": "В гостиной не работает отопление.",
    "de": "Die Heizung im Wohnzimmer funktioniert nicht.",
    "ru": "Отопление в гостиной не работает.",
    "topic": "home"
  },
  {
    "id": "s18-2",
    "situation": 18,
    "title": "Сообщить арендодателю о проблеме",
    "context": "В гостиной не работает отопление.",
    "de": "Seit gestern bleibt sie kalt.",
    "ru": "Со вчерашнего дня батарея остаётся холодной.",
    "topic": "home"
  },
  {
    "id": "s18-3",
    "situation": 18,
    "title": "Сообщить арендодателю о проблеме",
    "context": "В гостиной не работает отопление.",
    "de": "Könnten Sie bitte jemanden vorbeischicken?",
    "ru": "Вы не могли бы прислать кого-нибудь?",
    "topic": "home"
  },
  {
    "id": "s19-1",
    "situation": 19,
    "title": "Попросить соседей говорить тише",
    "context": "Поздно вечером ребёнок не может уснуть.",
    "de": "Entschuldigung, könnten Sie bitte etwas leiser sein?",
    "ru": "Извините, Вы не могли бы вести себя немного тише?",
    "topic": "home"
  },
  {
    "id": "s19-2",
    "situation": 19,
    "title": "Попросить соседей говорить тише",
    "context": "Поздно вечером ребёнок не может уснуть.",
    "de": "Meine Tochter kann wegen der Musik nicht einschlafen.",
    "ru": "Моя дочь не может уснуть из-за музыки.",
    "topic": "home"
  },
  {
    "id": "s19-3",
    "situation": 19,
    "title": "Попросить соседей говорить тише",
    "context": "Поздно вечером ребёнок не может уснуть.",
    "de": "Vielen Dank für Ihr Verständnis.",
    "ru": "Большое спасибо за понимание.",
    "topic": "home"
  },
  {
    "id": "s20-1",
    "situation": 20,
    "title": "Пригласить ребёнка в гости",
    "context": "Дочка хочет поиграть с подругой.",
    "de": "Meine Tochter würde gern mit Ihrer Tochter spielen.",
    "ru": "Моя дочь хотела бы поиграть с Вашей дочерью.",
    "topic": "family"
  },
  {
    "id": "s20-2",
    "situation": 20,
    "title": "Пригласить ребёнка в гости",
    "context": "Дочка хочет поиграть с подругой.",
    "de": "Haben Sie am Samstag Zeit?",
    "ru": "У Вас есть время в субботу?",
    "topic": "family"
  },
  {
    "id": "s20-3",
    "situation": 20,
    "title": "Пригласить ребёнка в гости",
    "context": "Дочка хочет поиграть с подругой.",
    "de": "Sie können gern zu uns kommen.",
    "ru": "Приходите к нам, будем рады.",
    "topic": "family"
  },
  {
    "id": "s21-1",
    "situation": 21,
    "title": "Договориться о рабочей встрече",
    "context": "Утром занят, предлагаешь время после обеда.",
    "de": "Vormittags habe ich schon eine andere Besprechung.",
    "ru": "До обеда у меня уже другая рабочая встреча.",
    "topic": "work"
  },
  {
    "id": "s21-2",
    "situation": 21,
    "title": "Договориться о рабочей встрече",
    "context": "Утром занят, предлагаешь время после обеда.",
    "de": "Können wir unseren Termin auf den Nachmittag verschieben?",
    "ru": "Можем перенести нашу встречу на время после обеда?",
    "topic": "work"
  },
  {
    "id": "s21-3",
    "situation": 21,
    "title": "Договориться о рабочей встрече",
    "context": "Утром занят, предлагаешь время после обеда.",
    "de": "Ab vierzehn Uhr hätte ich Zeit.",
    "ru": "Начиная с четырнадцати часов я был бы свободен.",
    "topic": "work"
  },
  {
    "id": "s22-1",
    "situation": 22,
    "title": "Уточнить рабочую задачу",
    "context": "Не до конца понял требования и срок.",
    "de": "Ich bin mir nicht sicher, ob ich die Aufgabe richtig verstanden habe.",
    "ru": "Я не уверен, правильно ли я понял задачу.",
    "topic": "work"
  },
  {
    "id": "s22-2",
    "situation": 22,
    "title": "Уточнить рабочую задачу",
    "context": "Не до конца понял требования и срок.",
    "de": "Könntest du mir ein Beispiel zeigen?",
    "ru": "Ты не мог бы показать мне пример?",
    "topic": "work"
  },
  {
    "id": "s22-3",
    "situation": 22,
    "title": "Уточнить рабочую задачу",
    "context": "Не до конца понял требования и срок.",
    "de": "Bis wann soll das fertig sein?",
    "ru": "К какому сроку это должно быть готово?",
    "topic": "work"
  },
  {
    "id": "s23-1",
    "situation": 23,
    "title": "Сообщить коллеге о препятствии",
    "context": "Не хватает информации для завершения работы.",
    "de": "Ich bin mit der Aufgabe noch nicht fertig.",
    "ru": "Я ещё не закончил задачу.",
    "topic": "work"
  },
  {
    "id": "s23-2",
    "situation": 23,
    "title": "Сообщить коллеге о препятствии",
    "context": "Не хватает информации для завершения работы.",
    "de": "Mir fehlen noch ein paar Informationen.",
    "ru": "Мне ещё не хватает кое-какой информации.",
    "topic": "work"
  },
  {
    "id": "s23-3",
    "situation": 23,
    "title": "Сообщить коллеге о препятствии",
    "context": "Не хватает информации для завершения работы.",
    "de": "Sobald ich sie habe, kann ich weitermachen.",
    "ru": "Как только она у меня будет, я смогу продолжить.",
    "topic": "work"
  },
  {
    "id": "s24-1",
    "situation": 24,
    "title": "Позвонить интернет-провайдеру",
    "context": "Интернет не работает, перезагрузка не помогла.",
    "de": "Seit heute Morgen funktioniert mein Internet nicht.",
    "ru": "С сегодняшнего утра у меня не работает интернет.",
    "topic": "services"
  },
  {
    "id": "s24-2",
    "situation": 24,
    "title": "Позвонить интернет-провайдеру",
    "context": "Интернет не работает, перезагрузка не помогла.",
    "de": "Ich habe den Router schon neu gestartet, aber das hat nicht geholfen.",
    "ru": "Я уже перезагрузил роутер, но это не помогло.",
    "topic": "services"
  },
  {
    "id": "s24-3",
    "situation": 24,
    "title": "Позвонить интернет-провайдеру",
    "context": "Интернет не работает, перезагрузка не помогла.",
    "de": "Können Sie mir sagen, woran das liegt?",
    "ru": "Вы можете сказать мне, в чём причина?",
    "topic": "services"
  },
  {
    "id": "s25-1",
    "situation": 25,
    "title": "Уточнить непонятное письмо",
    "context": "Получил письмо из учреждения и не понял, что делать.",
    "de": "Ich habe einen Brief von Ihnen bekommen.",
    "ru": "Я получил от Вас письмо.",
    "topic": "services"
  },
  {
    "id": "s25-2",
    "situation": 25,
    "title": "Уточнить непонятное письмо",
    "context": "Получил письмо из учреждения и не понял, что делать.",
    "de": "Leider habe ich nicht alles verstanden.",
    "ru": "К сожалению, я не всё понял.",
    "topic": "services"
  },
  {
    "id": "s25-3",
    "situation": 25,
    "title": "Уточнить непонятное письмо",
    "context": "Получил письмо из учреждения и не понял, что делать.",
    "de": "Könnten Sie mir bitte erklären, was ich tun muss?",
    "ru": "Вы не могли бы объяснить мне, что я должен сделать?",
    "topic": "services"
  },
  {
    "id": "s26-1",
    "situation": 26,
    "title": "Забрать документ в учреждении",
    "context": "Пришёл за готовым видом на жительство.",
    "de": "Ich bin hier, um meinen Aufenthaltstitel abzuholen.",
    "ru": "Я здесь, чтобы забрать свой вид на жительство.",
    "topic": "services"
  },
  {
    "id": "s26-2",
    "situation": 26,
    "title": "Забрать документ в учреждении",
    "context": "Пришёл за готовым видом на жительство.",
    "de": "Ich habe eine Nachricht bekommen, dass er fertig ist.",
    "ru": "Я получил сообщение, что он готов.",
    "topic": "services"
  },
  {
    "id": "s26-3",
    "situation": 26,
    "title": "Забрать документ в учреждении",
    "context": "Пришёл за готовым видом на жительство.",
    "de": "Hier sind mein Reisepass und die Terminbestätigung.",
    "ru": "Вот мой загранпаспорт и подтверждение записи.",
    "topic": "services"
  },
  {
    "id": "s27-1",
    "situation": 27,
    "title": "Уточнить документы для заявления",
    "context": "Хочешь узнать, что принести и можно ли отправить онлайн.",
    "de": "Welche Unterlagen brauche ich für den Antrag?",
    "ru": "Какие документы мне нужны для заявления?",
    "topic": "services"
  },
  {
    "id": "s27-2",
    "situation": 27,
    "title": "Уточнить документы для заявления",
    "context": "Хочешь узнать, что принести и можно ли отправить онлайн.",
    "de": "Muss ich die Originale mitbringen, oder reichen Kopien?",
    "ru": "Мне нужно принести оригиналы или достаточно копий?",
    "topic": "services"
  },
  {
    "id": "s27-3",
    "situation": 27,
    "title": "Уточнить документы для заявления",
    "context": "Хочешь узнать, что принести и можно ли отправить онлайн.",
    "de": "Kann ich die Unterlagen auch online einreichen?",
    "ru": "Можно подать документы и онлайн?",
    "topic": "services"
  },
  {
    "id": "s28-1",
    "situation": 28,
    "title": "Спросить о записи на Einbürgerungstest",
    "context": "Узнаёшь о регистрации и следующей дате.",
    "de": "Ich möchte mich für den Einbürgerungstest anmelden.",
    "ru": "Я хочу записаться на тест для получения гражданства.",
    "topic": "services"
  },
  {
    "id": "s28-2",
    "situation": 28,
    "title": "Спросить о записи на Einbürgerungstest",
    "context": "Узнаёшь о регистрации и следующей дате.",
    "de": "Wann findet der nächste Test statt?",
    "ru": "Когда состоится следующий тест?",
    "topic": "services"
  },
  {
    "id": "s28-3",
    "situation": 28,
    "title": "Спросить о записи на Einbürgerungstest",
    "context": "Узнаёшь о регистрации и следующей дате.",
    "de": "Können Sie mir sagen, wie ich mich anmelden kann?",
    "ru": "Вы можете сказать мне, как я могу записаться?",
    "topic": "services"
  },
  {
    "id": "s29-1",
    "situation": 29,
    "title": "Объяснить своё мнение",
    "context": "На языковом курсе обсуждаете жизнь в Германии.",
    "de": "Meiner Meinung nach ist Meinungsfreiheit sehr wichtig.",
    "ru": "По моему мнению, свобода слова очень важна.",
    "topic": "conversation"
  },
  {
    "id": "s29-2",
    "situation": 29,
    "title": "Объяснить своё мнение",
    "context": "На языковом курсе обсуждаете жизнь в Германии.",
    "de": "Jeder Mensch sollte seine Meinung sagen dürfen.",
    "ru": "Каждый человек должен иметь право высказывать своё мнение.",
    "topic": "conversation"
  },
  {
    "id": "s29-3",
    "situation": 29,
    "title": "Объяснить своё мнение",
    "context": "На языковом курсе обсуждаете жизнь в Германии.",
    "de": "Gleichzeitig müssen wir die Rechte anderer respektieren.",
    "ru": "При этом мы должны уважать права других.",
    "topic": "conversation"
  },
  {
    "id": "s30-1",
    "situation": 30,
    "title": "Решить ситуацию с изменением планов",
    "context": "Воспитательница предлагает другое время, но ты работаешь. Нужно найти решение.",
    "de": "Eigentlich muss ich um diese Zeit arbeiten.",
    "ru": "Вообще-то в это время мне нужно работать.",
    "topic": "family"
  },
  {
    "id": "s30-2",
    "situation": 30,
    "title": "Решить ситуацию с изменением планов",
    "context": "Воспитательница предлагает другое время, но ты работаешь. Нужно найти решение.",
    "de": "Wenn meine Frau unsere Tochter abholen kann, könnte ich zum Gespräch kommen.",
    "ru": "Если моя жена сможет забрать нашу дочь, я смог бы прийти на беседу.",
    "topic": "family"
  },
  {
    "id": "s30-3",
    "situation": 30,
    "title": "Решить ситуацию с изменением планов",
    "context": "Воспитательница предлагает другое время, но ты работаешь. Нужно найти решение.",
    "de": "Ich kläre das mit ihr und gebe Ihnen heute noch Bescheid.",
    "ru": "Я выясню это с ней и сообщу Вам ещё сегодня.",
    "topic": "family"
  },
  {
    "id": "s31-1",
    "situation": 31,
    "title": "Сборы в детский сад",
    "context": "Уточняешь, что нужно принести для ребёнка.",
    "de": "Soll ich meiner Tochter Wechselkleidung mitgeben?",
    "ru": "Мне дать дочери с собой сменную одежду?",
    "topic": "family"
  },
  {
    "id": "s31-2",
    "situation": 31,
    "title": "Сборы в детский сад",
    "context": "Уточняешь, что нужно принести для ребёнка.",
    "de": "Braucht sie morgen ihre Gummistiefel?",
    "ru": "Ей завтра нужны резиновые сапоги?",
    "topic": "family"
  },
  {
    "id": "s31-3",
    "situation": 31,
    "title": "Сборы в детский сад",
    "context": "Уточняешь, что нужно принести для ребёнка.",
    "de": "Meine Frau holt sie heute ab.",
    "ru": "Сегодня её заберёт моя жена.",
    "topic": "family"
  },
  {
    "id": "s31-4",
    "situation": 31,
    "title": "Сборы в детский сад",
    "context": "Уточняешь, что нужно принести для ребёнка.",
    "de": "Könnten Sie mich anrufen, wenn es ihr nicht gut geht?",
    "ru": "Вы не могли бы позвонить мне, если ей станет нехорошо?",
    "topic": "family"
  },
  {
    "id": "s31-5",
    "situation": 31,
    "title": "Сборы в детский сад",
    "context": "Уточняешь, что нужно принести для ребёнка.",
    "de": "Hat sie heute Mittag gut gegessen?",
    "ru": "Она сегодня хорошо поела в обед?",
    "topic": "family"
  },
  {
    "id": "s32-1",
    "situation": 32,
    "title": "Уточнить покупку и возврат",
    "context": "Проверяешь товар перед покупкой и условия возврата.",
    "de": "Ist der Artikel noch verfügbar?",
    "ru": "Этот товар ещё есть в наличии?",
    "topic": "shopping"
  },
  {
    "id": "s32-2",
    "situation": 32,
    "title": "Уточнить покупку и возврат",
    "context": "Проверяешь товар перед покупкой и условия возврата.",
    "de": "Kann ich mit Karte bezahlen?",
    "ru": "Можно оплатить картой?",
    "topic": "shopping"
  },
  {
    "id": "s32-3",
    "situation": 32,
    "title": "Уточнить покупку и возврат",
    "context": "Проверяешь товар перед покупкой и условия возврата.",
    "de": "Könnten Sie mir bitte den Kassenbon geben?",
    "ru": "Вы не могли бы дать мне чек?",
    "topic": "shopping"
  },
  {
    "id": "s32-4",
    "situation": 32,
    "title": "Уточнить покупку и возврат",
    "context": "Проверяешь товар перед покупкой и условия возврата.",
    "de": "Ich habe die falsche Größe bestellt.",
    "ru": "Я заказал не тот размер.",
    "topic": "shopping"
  },
  {
    "id": "s32-5",
    "situation": 32,
    "title": "Уточнить покупку и возврат",
    "context": "Проверяешь товар перед покупкой и условия возврата.",
    "de": "Wie lange habe ich Zeit, den Artikel zurückzugeben?",
    "ru": "Сколько у меня есть времени, чтобы вернуть товар?",
    "topic": "shopping"
  },
  {
    "id": "s33-1",
    "situation": 33,
    "title": "Уточнить лечение",
    "context": "На приёме рассказываешь о симптомах и задаёшь вопросы.",
    "de": "Die Schmerzen werden nachts stärker.",
    "ru": "Ночью боль усиливается.",
    "topic": "health"
  },
  {
    "id": "s33-2",
    "situation": 33,
    "title": "Уточнить лечение",
    "context": "На приёме рассказываешь о симптомах и задаёшь вопросы.",
    "de": "Ich bin gegen Penicillin allergisch.",
    "ru": "У меня аллергия на пенициллин.",
    "topic": "health"
  },
  {
    "id": "s33-3",
    "situation": 33,
    "title": "Уточнить лечение",
    "context": "На приёме рассказываешь о симптомах и задаёшь вопросы.",
    "de": "Soll ich die Tabletten vor oder nach dem Essen nehmen?",
    "ru": "Мне принимать таблетки до или после еды?",
    "topic": "health"
  },
  {
    "id": "s33-4",
    "situation": 33,
    "title": "Уточнить лечение",
    "context": "На приёме рассказываешь о симптомах и задаёшь вопросы.",
    "de": "Brauche ich dafür ein Rezept?",
    "ru": "Мне для этого нужен рецепт?",
    "topic": "health"
  },
  {
    "id": "s33-5",
    "situation": 33,
    "title": "Уточнить лечение",
    "context": "На приёме рассказываешь о симптомах и задаёшь вопросы.",
    "de": "Wann soll ich zur Kontrolle wiederkommen?",
    "ru": "Когда мне снова прийти на контрольный осмотр?",
    "topic": "health"
  },
  {
    "id": "s34-1",
    "situation": 34,
    "title": "Поесть в кафе",
    "context": "Заказываешь еду и просишь счёт.",
    "de": "Haben Sie noch einen Tisch für drei Personen frei?",
    "ru": "У вас ещё есть свободный столик на троих?",
    "topic": "food"
  },
  {
    "id": "s34-2",
    "situation": 34,
    "title": "Поесть в кафе",
    "context": "Заказываешь еду и просишь счёт.",
    "de": "Ich hätte gern ein stilles Wasser.",
    "ru": "Я хотел бы негазированную воду.",
    "topic": "food"
  },
  {
    "id": "s34-3",
    "situation": 34,
    "title": "Поесть в кафе",
    "context": "Заказываешь еду и просишь счёт.",
    "de": "Könnten wir bitte getrennt bezahlen?",
    "ru": "Мы могли бы заплатить отдельно?",
    "topic": "food"
  },
  {
    "id": "s34-4",
    "situation": 34,
    "title": "Поесть в кафе",
    "context": "Заказываешь еду и просишь счёт.",
    "de": "Könnten Sie mir den Rest bitte einpacken?",
    "ru": "Вы не могли бы упаковать мне оставшуюся еду с собой?",
    "topic": "food"
  },
  {
    "id": "s34-5",
    "situation": 34,
    "title": "Поесть в кафе",
    "context": "Заказываешь еду и просишь счёт.",
    "de": "Die Rechnung, bitte.",
    "ru": "Счёт, пожалуйста.",
    "topic": "food"
  },
  {
    "id": "s35-1",
    "situation": 35,
    "title": "Сориентироваться в поездке",
    "context": "Уточняешь маршрут и пересадку на вокзале.",
    "de": "Fährt dieser Bus zum Bahnhof?",
    "ru": "Этот автобус едет к вокзалу?",
    "topic": "travel"
  },
  {
    "id": "s35-2",
    "situation": 35,
    "title": "Сориентироваться в поездке",
    "context": "Уточняешь маршрут и пересадку на вокзале.",
    "de": "Wo muss ich umsteigen?",
    "ru": "Где мне нужно пересесть?",
    "topic": "travel"
  },
  {
    "id": "s35-3",
    "situation": 35,
    "title": "Сориентироваться в поездке",
    "context": "Уточняешь маршрут и пересадку на вокзале.",
    "de": "Auf welchem Gleis fährt der Zug ab?",
    "ru": "С какого пути отправляется поезд?",
    "topic": "travel"
  },
  {
    "id": "s35-4",
    "situation": 35,
    "title": "Сориентироваться в поездке",
    "context": "Уточняешь маршрут и пересадку на вокзале.",
    "de": "Ich habe meinen Anschluss verpasst.",
    "ru": "Я опоздал на пересадку.",
    "topic": "travel"
  },
  {
    "id": "s35-5",
    "situation": 35,
    "title": "Сориентироваться в поездке",
    "context": "Уточняешь маршрут и пересадку на вокзале.",
    "de": "Gilt mein Ticket auch für den nächsten Zug?",
    "ru": "Мой билет действует и на следующий поезд?",
    "topic": "travel"
  },
  {
    "id": "s36-1",
    "situation": 36,
    "title": "Зарядить и проверить машину",
    "context": "На зарядной станции возникла проблема, а машине нужен осмотр.",
    "de": "Die Ladesäule erkennt meine Karte nicht.",
    "ru": "Зарядная станция не распознаёт мою карту.",
    "topic": "car"
  },
  {
    "id": "s36-2",
    "situation": 36,
    "title": "Зарядить и проверить машину",
    "context": "На зарядной станции возникла проблема, а машине нужен осмотр.",
    "de": "Wie kann ich den Ladevorgang starten?",
    "ru": "Как мне начать зарядку?",
    "topic": "car"
  },
  {
    "id": "s36-3",
    "situation": 36,
    "title": "Зарядить и проверить машину",
    "context": "На зарядной станции возникла проблема, а машине нужен осмотр.",
    "de": "Das Ladekabel lässt sich nicht lösen.",
    "ru": "Зарядный кабель не удаётся отсоединить.",
    "topic": "car"
  },
  {
    "id": "s36-4",
    "situation": 36,
    "title": "Зарядить и проверить машину",
    "context": "На зарядной станции возникла проблема, а машине нужен осмотр.",
    "de": "Ich möchte den Reifendruck prüfen lassen.",
    "ru": "Я хочу, чтобы проверили давление в шинах.",
    "topic": "car"
  },
  {
    "id": "s36-5",
    "situation": 36,
    "title": "Зарядить и проверить машину",
    "context": "На зарядной станции возникла проблема, а машине нужен осмотр.",
    "de": "Können Sie mir vorher sagen, wie viel die Reparatur ungefähr kostet?",
    "ru": "Вы можете заранее сказать мне, сколько примерно будет стоить ремонт?",
    "topic": "car"
  },
  {
    "id": "s37-1",
    "situation": 37,
    "title": "Решить бытовую проблему",
    "context": "Договариваешься с соседями и мастером.",
    "de": "Unter der Spüle tropft Wasser.",
    "ru": "Под кухонной раковиной капает вода.",
    "topic": "home"
  },
  {
    "id": "s37-2",
    "situation": 37,
    "title": "Решить бытовую проблему",
    "context": "Договариваешься с соседями и мастером.",
    "de": "Wann könnte jemand zur Reparatur kommen?",
    "ru": "Когда кто-нибудь мог бы прийти для ремонта?",
    "topic": "home"
  },
  {
    "id": "s37-3",
    "situation": 37,
    "title": "Решить бытовую проблему",
    "context": "Договариваешься с соседями и мастером.",
    "de": "Ich bin morgen ab zehn Uhr zu Hause.",
    "ru": "Завтра я буду дома с десяти часов.",
    "topic": "home"
  },
  {
    "id": "s37-4",
    "situation": 37,
    "title": "Решить бытовую проблему",
    "context": "Договариваешься с соседями и мастером.",
    "de": "Könnten Sie ein Paket für mich annehmen?",
    "ru": "Вы не могли бы принять для меня посылку?",
    "topic": "home"
  },
  {
    "id": "s37-5",
    "situation": 37,
    "title": "Решить бытовую проблему",
    "context": "Договариваешься с соседями и мастером.",
    "de": "Ich habe mich ausgesperrt und brauche einen Schlüsseldienst.",
    "ru": "Я захлопнул дверь и остался без ключа снаружи, мне нужна служба вскрытия замков.",
    "topic": "home"
  },
  {
    "id": "s38-1",
    "situation": 38,
    "title": "Согласовать работу",
    "context": "Обсуждаешь сроки, помощь и результат с коллегой.",
    "de": "Ich brauche dafür noch etwas mehr Zeit.",
    "ru": "Мне нужно для этого ещё немного времени.",
    "topic": "work"
  },
  {
    "id": "s38-2",
    "situation": 38,
    "title": "Согласовать работу",
    "context": "Обсуждаешь сроки, помощь и результат с коллегой.",
    "de": "Können wir kurz darüber sprechen?",
    "ru": "Можем коротко это обсудить?",
    "topic": "work"
  },
  {
    "id": "s38-3",
    "situation": 38,
    "title": "Согласовать работу",
    "context": "Обсуждаешь сроки, помощь и результат с коллегой.",
    "de": "Ich schicke dir die Datei bis morgen Mittag.",
    "ru": "Я пришлю тебе файл до завтрашнего полудня.",
    "topic": "work"
  },
  {
    "id": "s38-4",
    "situation": 38,
    "title": "Согласовать работу",
    "context": "Обсуждаешь сроки, помощь и результат с коллегой.",
    "de": "Könntest du bitte noch einmal drüberschauen?",
    "ru": "Ты не мог бы ещё раз это просмотреть?",
    "topic": "work"
  },
  {
    "id": "s38-5",
    "situation": 38,
    "title": "Согласовать работу",
    "context": "Обсуждаешь сроки, помощь и результат с коллегой.",
    "de": "Ich bin heute im Homeoffice erreichbar.",
    "ru": "Сегодня я работаю из дома и буду на связи.",
    "topic": "work"
  },
  {
    "id": "s39-1",
    "situation": 39,
    "title": "Уточнить заявление и договор",
    "context": "Выясняешь, как оформить документы и закончить договор.",
    "de": "Könnten Sie mir den Eingang meiner Unterlagen bestätigen?",
    "ru": "Вы не могли бы подтвердить получение моих документов?",
    "topic": "services"
  },
  {
    "id": "s39-2",
    "situation": 39,
    "title": "Уточнить заявление и договор",
    "context": "Выясняешь, как оформить документы и закончить договор.",
    "de": "Wie lange dauert die Bearbeitung ungefähr?",
    "ru": "Сколько примерно занимает рассмотрение?",
    "topic": "services"
  },
  {
    "id": "s39-3",
    "situation": 39,
    "title": "Уточнить заявление и договор",
    "context": "Выясняешь, как оформить документы и закончить договор.",
    "de": "Muss ich dafür persönlich vorbeikommen?",
    "ru": "Мне для этого нужно прийти лично?",
    "topic": "services"
  },
  {
    "id": "s39-4",
    "situation": 39,
    "title": "Уточнить заявление и договор",
    "context": "Выясняешь, как оформить документы и закончить договор.",
    "de": "Ich möchte meine neue Adresse mitteilen.",
    "ru": "Я хочу сообщить свой новый адрес.",
    "topic": "services"
  },
  {
    "id": "s39-5",
    "situation": 39,
    "title": "Уточнить заявление и договор",
    "context": "Выясняешь, как оформить документы и закончить договор.",
    "de": "Zu welchem Termin kann ich den Vertrag kündigen?",
    "ru": "С какой даты я могу расторгнуть договор?",
    "topic": "services"
  },
  {
    "id": "s40-1",
    "situation": 40,
    "title": "Поддержать разговор",
    "context": "Просишь пояснение и спокойно выражаешь свою позицию.",
    "de": "Könntest du bitte etwas langsamer sprechen?",
    "ru": "Ты не мог бы говорить немного медленнее?",
    "topic": "conversation"
  },
  {
    "id": "s40-2",
    "situation": 40,
    "title": "Поддержать разговор",
    "context": "Просишь пояснение и спокойно выражаешь свою позицию.",
    "de": "Was meinst du genau damit?",
    "ru": "Что именно ты имеешь в виду?",
    "topic": "conversation"
  },
  {
    "id": "s40-3",
    "situation": 40,
    "title": "Поддержать разговор",
    "context": "Просишь пояснение и спокойно выражаешь свою позицию.",
    "de": "Da bin ich anderer Meinung.",
    "ru": "В этом я придерживаюсь другого мнения.",
    "topic": "conversation"
  },
  {
    "id": "s40-4",
    "situation": 40,
    "title": "Поддержать разговор",
    "context": "Просишь пояснение и спокойно выражаешь свою позицию.",
    "de": "Das habe ich so noch nicht gesehen.",
    "ru": "Я ещё не смотрел на это с такой стороны.",
    "topic": "conversation"
  },
  {
    "id": "s40-5",
    "situation": 40,
    "title": "Поддержать разговор",
    "context": "Просишь пояснение и спокойно выражаешь свою позицию.",
    "de": "Lass mich kurz überlegen.",
    "ru": "Дай мне немного подумать.",
    "topic": "conversation"
  }
];
