# Firebase

Проект: `deutsch-a2-b1`, Firestore Standard, `europe-west3` (Frankfurt), тариф Spark.
Вход: Google; разрешённый домен приложения: `vladimir-fsh.github.io`.

Правила в `firestore.rules` опубликованы через Firebase Console. Изменение правил
в Git само по себе их не публикует. При последующих изменениях обновить и проверить
правила в консоли проекта.

Web-параметры в `js/cloud-config.js` публичны. Firestore проверяет вошедшего
пользователя и разрешает доступ только к его `/users/{uid}/…`.

Первое подключение: в приложении на устройстве с основным прогрессом открыть
«Ещё → Облако и вход», войти через Google. Синхронизация подключается автоматически.
На другом устройстве войти в тот же аккаунт; прогресс загрузится автоматически.
После подключения ответы и изменения личного курса отправляются автоматически.
Без сети они остаются в местном журнале.

Если на втором устройстве уже другой исходный прогресс, синхронизация остановится.
Экспортировать обе версии перед выбором основного источника. Их стартовые снимки
не складываются автоматически, чтобы не удвоить ответы или затереть расписание.

Черновики и незавершённые сессии копируются отдельно от общего прогресса.
Для продолжения выбрать копию в «Занятия с других устройств»; эта команда заменяет
только местные черновики и сессии, завершённые ответы остаются общими.

Google-вход следует проверять на опубликованном HTTPS-адресе. LAN-адрес локального
предпросмотра не входит в разрешённые OAuth-домены. Popup выбран для GitHub Pages,
чтобы не зависеть от cross-origin storage при redirect-входе на стороннем хостинге.

Автоматические проверки: `node --test tools/test-cloud.js`.
Они используют подставной Firebase, без сетевых запросов и личных ключей.

## Сервер чата

Код подготовлен в `firebase/functions`, Cloud Functions 2nd gen, Node.js 22,
регион `europe-west3`. Отдельного автоматического развёртывания Functions нет.
GitHub Pages публикует только клиент: каталог `firebase` в сайт не входит.

Путь запроса: браузер с Firebase ID token → `explainGerman` → OpenAI Responses API.
Ключ вводится в настройках приложения и через callable `tutorSettings` записывается
в Google Cloud Secret Manager (`OPENAI_API_KEY`). После сохранения поле очищается;
обратно браузер получает только признак сохранения. Ключ не попадает в localStorage,
прогресс или резервные копии. Firestore `tutorSettings/{uid}` хранит только номер
активной версии и время изменения. Чат читает эту точную версию при каждом запросе.
Замена ключа не требует deploy и не зависит от согласованности псевдонима `latest`.
Системный промпт и модель задаются в `firebase/functions/tutor.js`, а не клиентом.
Секреты нельзя класть в `js/cloud-config.js`, `.env` сайта или GitHub Pages.

Функция принимает только владельца с UID из серверного параметра `TUTOR_OWNER_UID`.
Остальные пользователи, включая вошедших через Google, получают отказ до обращения
к OpenAI. CORS разрешён для `https://vladimir-fsh.github.io`; он дополняет проверку
UID, но не заменяет её. Проверка владельца выполняется и для статуса, и для
сохранения ключа. Получить сохранённое значение через callable нельзя.
Другие сайты и локальный LAN-предпросмотр не добавлены.
App Check пока не используется; доступ ограничивается проверенным ID token и UID.

В закрытой для клиентских SDK коллекции `tutorUsage` сервер хранит только счётчики
и кратковременную блокировку: 5 запросов в минуту, 60 в сутки по UTC, один запрос
одновременно. Попытка после валидации расходует лимит даже при ошибке OpenAI.
Блокировка истекает через 65 секунд. Ограничения вычисляются транзакцией Firestore,
поэтому работают после перезапуска и при конкурентных вызовах. Лимиты запросов
не являются денежным лимитом расходов Firebase/OpenAI.

Сохранение ключа имеет отдельную квоту в `tutorKeyUsage`: 2 запроса в минуту,
10 в сутки, один одновременно. При обрыве обработки блокировка истекает через
120 секунд, позже максимального времени работы функции. Прямые чтение и запись клиентских SDK в
`tutorSettings`, `tutorKeyUsage`, `tutorUsage` закрыты правилами Firestore по умолчанию.
Если запись указателя после создания секретной версии не удалась, старый ключ
остаётся активным. Неиспользованные и прежние версии остаются в Secret Manager;
их жизненным циклом управляет администратор проекта.

Контекст, история и ответы в Firestore не сохраняются и явно не логируются.
Остановка ожидания в браузере не гарантирует остановку уже начатой генерации
на сервере. При смене аккаунта интерфейс очищает историю и отбрасывает поздние ответы.

### Первоначальное развёртывание

Ниже подготовленная процедура; она ещё не выполнена. Понадобятся доступ владельца
к проекту `deutsch-a2-b1`, UID его Google-пользователя из Firebase Authentication,
подключённая оплата Blaze. Ключ вводится позже в приложении; передавать его агенту
или помещать в терминальные команды не требуется. Переключение Spark → Blaze выполняет
владелец проекта: [Firebase требует Blaze для публикации Functions](https://firebase.google.com/docs/functions/get-started).

1. В Firebase Console проекта открыть Authentication → Users, найти свой аккаунт
   и скопировать UID. Если его ещё нет, сначала войти через Google на опубликованном сайте.
2. В терминале из корня проекта выполнить `npx firebase-tools login`, выбрав
   аккаунт с правами управления проектом. Нельзя использовать сервисный ключ в файлах сайта.
3. В Cloud Shell проекта создать отдельный runtime service account и пустой секрет.
   Эти действия выполняются один раз; существующие ресурсы повторно создавать не нужно:

   ```sh
   gcloud services enable secretmanager.googleapis.com --project deutsch-a2-b1
   gcloud iam service-accounts create german-tutor --display-name="German tutor functions" --project deutsch-a2-b1
   gcloud secrets create OPENAI_API_KEY --replication-policy=automatic --project deutsch-a2-b1
   gcloud secrets add-iam-policy-binding OPENAI_API_KEY --member="serviceAccount:german-tutor@deutsch-a2-b1.iam.gserviceaccount.com" --role=roles/secretmanager.secretAccessor --project deutsch-a2-b1
   gcloud secrets add-iam-policy-binding OPENAI_API_KEY --member="serviceAccount:german-tutor@deutsch-a2-b1.iam.gserviceaccount.com" --role=roles/secretmanager.secretVersionAdder --project deutsch-a2-b1
   gcloud projects add-iam-policy-binding deutsch-a2-b1 --member="serviceAccount:german-tutor@deutsch-a2-b1.iam.gserviceaccount.com" --role=roles/datastore.user
   ```

   Runtime получает доступ к чтению и добавлению версий одного секрета,
   без права менять его IAM или создавать другие секреты. Firestore нужен для
   серверных метаданных и лимитов. [Роли Secret Manager](https://docs.cloud.google.com/secret-manager/docs/access-control).
4. Выполнить `npm ci --prefix firebase/functions --ignore-scripts`, затем
   `node --test tools/test-cloud.js tools/test-tutor.js tools/test-tutor-server.js tools/test-tutor-settings.js`.
5. Выполнить `npx firebase-tools deploy --only functions:german-tutor --project deutsch-a2-b1`.
   На запрос `TUTOR_OWNER_UID` ввести свой UID. CLI сохранит этот несекретный параметр
   в игнорируемом `.env.deutsch-a2-b1` внутри `firebase/functions`. Ключ там не нужен.
6. После успешного развёртывания опубликовать клиент через существующий Pages workflow.
   На телефоне войти через Google, открыть чат и нажать «Добавить API-ключ», ввести ключ
   и нажать «Сохранить в Firebase». После сохранения поле очищается, настройки
   закрываются, кнопка добавления заменяется двумя командами объяснения.
   Проверить объяснение слова и уточняющий вопрос, затем повторить с другого устройства:
   ключ вводить заново не требуется. Другой аккаунт должен получать отказ.
   В Network ключ допустим только в HTTPS-теле запроса `tutorSettings` при сохранении;
   в ответах, запросах объяснений, адресах и статическом сайте его быть не должно.

Проверки без ключей и сети: `node --test tools/test-tutor.js tools/test-tutor-server.js tools/test-tutor-settings.js`.
Они проверяют интерфейс, Firebase-протокол, авторизацию, границы ввода, промпт,
скрытие ошибок, конкурентные лимиты, смену ключа без deploy и отказ записи метаданных.

В серверном package.json закреплён `rimraf@6.1.4` через overrides: версии,
подтягиваемые Google SDK, содержали уязвимые glob/minimatch. По [документации rimraf](https://github.com/isaacs/rimraf#major-changes)
переход 5 → 6 меняет требование Node.js на 20/22, сервер использует Node.js 22.
