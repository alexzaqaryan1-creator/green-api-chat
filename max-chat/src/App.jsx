import { useCallback, useEffect, useState } from 'react'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import NewChatModal from './components/NewChatModal'
import { sendMessage, checkWhatsapp } from './api/greenApi'
import { useNotifications } from './hooks/useNotifications'
import { extractText, storage } from './utils'

const CREDS_KEY = 'max-chat:creds'
const chatsKey = (id) => `max-chat:chats:${id}`

// Старые версии хранили один maxId; теперь у чата список известных идентификаторов (ids)
function loadChats(idInstance) {
  return storage.get(chatsKey(idInstance), []).map((c) => ({
    ...c,
    ids: c.ids || (c.maxId ? [c.maxId] : []),
  }))
}

const phoneFromId = (id) => (String(id || '').endsWith('@c.us') ? id.split('@')[0] : '')

// Добавить чату ownerId идентификатор chatId (например, @lid).
// Если по этому идентификатору уже создан отдельный чат — объединяем их в один.
function attachChatId(chats, ownerId, chatId) {
  const owner = chats.find((c) => c.id === ownerId)
  if (!owner || !chatId) return chats
  const dup = chats.find((c) => c !== owner && (c.id === chatId || (c.ids || []).includes(chatId)))
  if ((owner.ids || []).includes(chatId) && !dup) return chats
  const seen = new Set(owner.messages.map((m) => m.id))
  const merged = {
    ...owner,
    ids: Array.from(new Set([...(owner.ids || []), chatId, ...((dup && dup.ids) || [])])),
    name: owner.name || dup?.name || '',
    messages: [...owner.messages, ...(dup ? dup.messages.filter((m) => !seen.has(m.id)) : [])].sort((a, b) => a.ts - b.ts),
    unread: (owner.unread || 0) + (dup?.unread || 0),
    updatedAt: Math.max(owner.updatedAt || 0, dup?.updatedAt || 0),
  }
  return chats.filter((c) => c !== dup).map((c) => (c === owner ? merged : c))
}

// То же, но чат ищем по id отправленного сообщения
function linkChatId(chats, msgId, chatId) {
  const owner = chats.find((c) => c.messages.some((m) => m.id === msgId))
  return owner ? attachChatId(chats, owner.id, chatId) : chats
}

export default function App() {
  const [creds, setCreds] = useState(() => storage.get(CREDS_KEY, null))
  const [chats, setChats] = useState(() => (creds ? loadChats(creds.idInstance) : []))
  const [activeId, setActiveId] = useState(null)
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    if (creds) storage.set(chatsKey(creds.idInstance), chats)
  }, [chats, creds])

  // WhatsApp постепенно заменяет номера на @lid: входящие могут прийти с chatId вида 1555...@lid.
  // Для каждого чата с номером один раз узнаём его @lid через CheckWhatsapp, чтобы ответы попадали в тот же чат.
  useEffect(() => {
    if (!creds) return
    const pending = chats.filter((c) => c.phone && !c.lidChecked)
    if (!pending.length) return
    const ids = new Set(pending.map((c) => c.id))
    setChats((prev) => prev.map((c) => (ids.has(c.id) ? { ...c, lidChecked: true } : c)))
    pending.forEach(async (c) => {
      try {
        const res = await checkWhatsapp(creds, c.phone)
        const lid = res?.chatId
        if (lid && !String(lid).endsWith('@c.us')) setChats((prev) => attachChatId(prev, c.id, lid))
      } catch {
        /* метод может быть недоступен (например, для MAX) — не критично */
      }
    })
  }, [chats, creds])

  function handleLogin(c) {
    storage.set(CREDS_KEY, c)
    setChats(loadChats(c.idInstance))
    setCreds(c)
  }

  function handleLogout() {
    storage.remove(CREDS_KEY)
    setCreds(null)
    setChats([])
    setActiveId(null)
  }

  function createChat({ phone, name }) {
    const existing = chats.find((c) => c.phone === phone)
    if (existing) {
      setActiveId(existing.id)
    } else {
      const chat = { id: phone, phone, ids: [], name, messages: [], unread: 0, updatedAt: Date.now() }
      setChats((prev) => [chat, ...prev])
      setActiveId(chat.id)
    }
    setShowNewChat(false)
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((c) => c.id !== id))
    setActiveId(null)
  }

  function selectChat(id) {
    setActiveId(id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  const updateMessage = (chatId, msgId, patch) =>
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) } : c
      )
    )

  async function handleSend(chatId, text) {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return
    const tempId = `tmp-${Date.now()}`
    const msg = { id: tempId, dir: 'out', text, ts: Date.now(), status: 'pending' }
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, msg], updatedAt: msg.ts } : c))
    )
    // По номеру телефона (79991234567@c.us), а если номера нет — по известному id чата (MAX id или @lid).
    const target = chat.phone ? `${chat.phone}@c.us` : chat.ids[0]
    try {
      const res = await sendMessage(creds, target, text)
      updateMessage(chatId, tempId, { id: res?.idMessage || tempId, status: 'sent' })
    } catch (e) {
      updateMessage(chatId, tempId, { status: 'error', error: e.message })
    }
  }

  // Обработка входящих уведомлений
  const handleNotification = useCallback(
    (body) => {
      if (!body) return
      const type = body.typeWebhook

      if (type === 'incomingMessageReceived') {
        const text = extractText(body.messageData)
        const sd = body.senderData || {}
        if (text == null || sd.chatType === 'group' || String(sd.chatId || '').endsWith('@g.us')) return
        // MAX присылает senderPhoneNumber, WhatsApp — chatId вида 79991234567@c.us или 1555...@lid
        const phone = sd.senderPhoneNumber ? String(sd.senderPhoneNumber) : phoneFromId(sd.chatId) || phoneFromId(sd.sender)
        const knownIds = [sd.chatId, sd.sender].filter((x) => x && !String(x).endsWith('@c.us'))
        const ts = body.timestamp ? body.timestamp * 1000 : Date.now()
        const message = { id: body.idMessage || `in-${ts}`, dir: 'in', text, ts }

        setChats((prev) => {
          const idx = prev.findIndex(
            (c) => (phone && c.phone === phone) || knownIds.some((id) => (c.ids || []).includes(id))
          )
          if (idx === -1) {
            const chat = {
              id: phone || sd.chatId,
              phone,
              ids: knownIds,
              name: sd.senderContactName || sd.senderName || sd.chatName || '',
              messages: [message],
              unread: 1,
              updatedAt: ts,
            }
            return [chat, ...prev]
          }
          const c = prev[idx]
          if (c.messages.some((m) => m.id === message.id)) return prev
          const updated = {
            ...c,
            ids: Array.from(new Set([...(c.ids || []), ...knownIds])),
            name: c.name || sd.senderContactName || sd.senderName || '',
            messages: [...c.messages, message],
            unread: c.id === activeId ? 0 : (c.unread || 0) + 1,
            updatedAt: ts,
          }
          return prev.map((x, i) => (i === idx ? updated : x))
        })
        return
      }

      // Сообщение, отправленное через API: узнаём реальный id чата (MAX id или @lid) и связываем с нашим чатом
      if (type === 'outgoingAPIMessageReceived') {
        const chatId = body.senderData?.chatId
        if (chatId && !chatId.endsWith('@c.us')) setChats((prev) => linkChatId(prev, body.idMessage, chatId))
        return
      }

      // Сообщение, отправленное с телефона
      if (type === 'outgoingMessageReceived') {
        const text = extractText(body.messageData)
        const chatId = body.senderData?.chatId
        if (text == null || !chatId) return
        const phone = phoneFromId(chatId)
        const ts = body.timestamp ? body.timestamp * 1000 : Date.now()
        setChats((prev) =>
          prev.map((c) =>
            ((phone && c.phone === phone) || (c.ids || []).includes(chatId)) && !c.messages.some((m) => m.id === body.idMessage)
              ? { ...c, messages: [...c.messages, { id: body.idMessage, dir: 'out', text, ts, status: 'sent' }], updatedAt: ts }
              : c
          )
        )
        return
      }

      if (type === 'outgoingMessageStatus') {
        const status = body.status === 'failed' ? 'error' : body.status
        const chatId = body.chatId
        setChats((prev) =>
          (chatId && !chatId.endsWith('@c.us') ? linkChatId(prev, body.idMessage, chatId) : prev).map((c) =>
            c.messages.some((m) => m.id === body.idMessage)
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === body.idMessage ? { ...m, status, error: status === 'error' ? body.description || 'failed' : m.error } : m
                  ),
                }
              : c
          )
        )
      }
    },
    [activeId]
  )

  useNotifications(creds, handleNotification)

  if (!creds) return <Login onLogin={handleLogin} />

  const activeChat = chats.find((c) => c.id === activeId)

  return (
    <div className={`app ${activeChat ? 'has-active' : ''}`}>
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={selectChat}
        onNewChat={() => setShowNewChat(true)}
        onLogout={handleLogout}
        idInstance={creds.idInstance}
      />
      {activeChat ? (
        <ChatWindow chat={activeChat} onSend={handleSend} onBack={() => setActiveId(null)} onDelete={deleteChat} />
      ) : (
        <section className="chat placeholder">
          <div className="placeholder-inner">
            <div className="logo big" aria-hidden="true">M</div>
            <p>Выберите чат или создайте новый по номеру телефона</p>
            <button className="primary" onClick={() => setShowNewChat(true)}>Новый чат</button>
          </div>
        </section>
      )}
      {showNewChat && <NewChatModal onCreate={createChat} onClose={() => setShowNewChat(false)} />}
    </div>
  )
}
