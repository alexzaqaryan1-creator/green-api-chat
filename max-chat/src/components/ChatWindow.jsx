import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import { formatPhone } from '../utils'

const STATUS_ICON = {
  pending: '🕓',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
  error: '!',
}

function timeOf(ts) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow({ chat, onSend, onBack, onDelete }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const title = chat.name || formatPhone(chat.phone) || chat.ids?.[0] || chat.id

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages.length, chat.id])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chat.id])

  function submit() {
    const value = text.trim()
    if (!value) return
    onSend(chat.id, value)
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <header className="chat-header">
        <button className="icon-btn back" onClick={onBack} aria-label="Назад к чатам">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <Avatar name={title} seed={chat.id} size={40} />
        <div className="chat-header-info">
          <div className="chat-header-title">{title}</div>
          {chat.phone && chat.name && <div className="muted small">{formatPhone(chat.phone)}</div>}
        </div>
        <button
          className="icon-btn delete"
          onClick={() => window.confirm('Удалить чат из списка? Сообщения в мессенджере останутся.') && onDelete(chat.id)}
          title="Удалить чат"
          aria-label="Удалить чат"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </header>

      <div className="messages" ref={listRef}>
        {chat.messages.length === 0 && (
          <div className="messages-empty">Напишите первое сообщение — оно уйдёт получателю в мессенджер.</div>
        )}
        {chat.messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.dir}`}>
            <div className={`bubble ${m.dir} ${m.status === 'error' ? 'failed' : ''}`}>
              <span className="bubble-text">{m.text}</span>
              <span className="bubble-meta">
                {timeOf(m.ts)}
                {m.dir === 'out' && (
                  <span className={`status ${m.status}`} title={m.error || m.status}>
                    {STATUS_ICON[m.status] || ''}
                  </span>
                )}
              </span>
            </div>
            {m.status === 'error' && <div className="bubble-error">Не отправлено: {m.error}</div>}
          </div>
        ))}
      </div>

      <footer className="composer">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          maxLength={4000}
        />
        <button className="send-btn" onClick={submit} disabled={!text.trim()} aria-label="Отправить">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>
        </button>
      </footer>
    </section>
  )
}
