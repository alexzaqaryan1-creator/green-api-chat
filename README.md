# Chat — GREEN-API (WhatsApp / MAX)

Простой веб-интерфейс на React для отправки и получения текстовых сообщений через [GREEN-API](https://green-api.com). Внешний вид взят с web.max.ru.

🔗 Демо:https://green-api-chat-yyih.vercel.app/

Проект протестирован с инстансом **WhatsApp** (тариф Developer), так как регистрация в MAX требует номер РФ/РБ. Код совместим и с инстансом MAX: методы `sendMessage`, `receiveNotification`, `deleteNotification` имеют одинаковый формат.

## Возможности

- Вход по данным инстанса GREEN-API (`idInstance`, `apiTokenInstance`, `apiUrl`) с проверкой статуса через `getStateInstance`.
- Создание чата по номеру телефона получателя.
- Отправка текстовых сообщений методом [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/).
- Получение входящих сообщений по технологии [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/): `receiveNotification` → обработка → `deleteNotification`.
- Статусы исходящих сообщений: отправлено ✓, доставлено ✓✓, прочитано (синие ✓✓), ошибка.
- Поддержка нового формата идентификаторов WhatsApp `@lid`: приложение получает `@lid` через [CheckWhatsapp](https://green-api.com/en/docs/api/service/CheckWhatsapp/) и объединяет чаты, чтобы ответ попадал в тот же диалог.
- Чаты и данные входа сохраняются в localStorage браузера.
- Адаптивная вёрстка (десктоп и мобильный).

## Стек

React 18 + Vite, без сторонних UI-библиотек.

## Локальный запуск

Требуется Node.js 18+.

```bash
git clone https://github.com/ВАШ-ЛОГИН/green-api-chat.git
cd green-api-chat/max-chat
npm install
npm run dev
```

Откройте http://localhost:5173

## Подготовка инстанса GREEN-API

1. Зарегистрируйтесь в [console.green-api.com](https://console.green-api.com) и создайте инстанс (WhatsApp Developer или MAX).
2. Авторизуйте инстанс, отсканировав QR-код в приложении мессенджера.
3. В разделе **Webhooks** оставьте поле Webhook Url пустым и включите:
   - Receive webhooks on incoming messages and files
   - Receive webhooks on messages sent from API
   - Receive webhooks on sent messages statuses
4. Скопируйте `apiUrl`, `idInstance` и `apiTokenInstance` из карточки инстанса.

## Как пользоваться

1. Введите `idInstance`, `apiTokenInstance` и `apiUrl` → «Войти».
2. Нажмите «+» и введите номер получателя в международном формате без «+» (например, `79991234567`).
3. Напишите сообщение и нажмите Enter (Shift+Enter — перенос строки).
4. Ответ получателя появится в чате автоматически.

## Структура

```
max-chat/src/
  api/greenApi.js            — запросы к GREEN-API
  hooks/useNotifications.js  — цикл получения уведомлений (long polling)
  components/                — Login, Sidebar, ChatWindow, NewChatModal, Avatar
  App.jsx                    — состояние чатов и обработка уведомлений
  utils.js                   — форматирование, localStorage, разбор сообщений
```
