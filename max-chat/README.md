# Chat — GREEN-API (WhatsApp / MAX)

Простой веб-интерфейс для отправки и получения текстовых сообщений через [GREEN-API](https://green-api.com). Внешний вид взят с web.max.ru.

Проект протестирован с инстансом **WhatsApp** (тариф Developer), так как регистрация в MAX требует номер РФ/РБ. Код совместим и с инстансом MAX: формат методов `sendMessage`, `receiveNotification`, `deleteNotification` одинаковый, а входящие сообщения сопоставляются с чатом как по `chatId` (`79991234567@c.us` в WhatsApp), так и по `senderPhoneNumber` (MAX).

## Возможности

- Вход по учётным данным инстанса GREEN-API (`idInstance`, `apiTokenInstance`) с проверкой статуса через `getStateInstance`.
- Создание чата по номеру телефона получателя (с проверкой через [CheckWhatsapp](https://green-api.com/en/docs/api/service/CheckWhatsapp/), который возвращает `@lid` собеседника).
- Отправка текстовых сообщений методом [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/).
- Получение входящих сообщений по технологии [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/) (`receiveNotification` + `deleteNotification`, long polling).
- Статусы исходящих сообщений (отправлено / доставлено / прочитано / ошибка).
- Чаты и данные входа сохраняются в localStorage браузера.
- Адаптивная вёрстка (десктоп и мобильный).

## Стек

React 18 + Vite, без сторонних UI-библиотек.

## Локальный запуск

Требуется Node.js 18+.

```bash
git clone <ссылка на репозиторий>
cd max-chat-green-api
npm install
npm run dev
```

Откройте http://localhost:5173

Сборка продакшн-версии: `npm run build` (результат в папке `dist`).

## Подготовка инстанса GREEN-API

1. Зарегистрируйтесь в [console.green-api.com](https://console.green-api.com) и создайте инстанс (WhatsApp Developer или MAX).
2. Авторизуйте инстанс, отсканировав QR-код в приложении мессенджера.
3. В настройках инстанса включите «Получать уведомления о входящих сообщениях и файлах» (и при желании — статусы исходящих сообщений).
4. Скопируйте `idInstance`, `apiTokenInstance` и `apiUrl` из карточки инстанса.

`apiUrl` скопируйте из карточки инстанса в поле на экране входа. Если поле пустое, адрес подставляется автоматически по первым 4 цифрам `idInstance`.

## Как пользоваться

1. Введите `idInstance`, `apiTokenInstance` и `apiUrl` → «Войти».
2. Нажмите «+» и введите номер получателя в международном формате (например, `79991234567`).
3. Напишите сообщение и нажмите Enter (Shift+Enter — перенос строки).
4. Ответ получателя появится в чате автоматически.

## Структура

```
src/
  api/greenApi.js          — запросы к GREEN-API
  hooks/useNotifications.js — цикл получения уведомлений
  components/               — Login, Sidebar, ChatWindow, NewChatModal, Avatar
  App.jsx                   — состояние чатов и обработка уведомлений
  utils.js                  — форматирование, localStorage, разбор сообщений
```

## Примечания

- В WhatsApp `chatId` может приходить как `79991234567@c.us`, так и в новом формате `@lid` (WhatsApp постепенно скрывает номера). В MAX это числовой id пользователя. Приложение хранит для каждого чата список известных идентификаторов: при создании чата получает `@lid` методом CheckWhatsapp, а после отправки сообщения из уведомлений `outgoingAPIMessageReceived` / `outgoingMessageStatus` оно узнаёт реальный `chatId` и автоматически объединяет чат, если ответ пришёл с другим идентификатором.
- Для получения сообщений в настройках инстанса должны быть включены уведомления о входящих сообщениях, об отправленных через API и о статусах, а поле Webhook Url — пустым.
- Обрабатываются только текстовые сообщения (`textMessage`, `extendedTextMessage`), как требует задание.
