import Avatar from './Avatar'
import { formatPhone, formatTime } from '../utils'

export default function Sidebar({ chats, activeId, onSelect, onNewChat, onLogout, idInstance }) {
  const sorted = [...chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Чаты</h1>
        <button className="icon-btn accent" onClick={onNewChat} title="Новый чат" aria-label="Новый чат">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </header>

      <ul className="chat-list">
        {sorted.length === 0 && (
          <li className="chat-list-empty">
            <p>Пока нет чатов.</p>
            <button className="primary small" onClick={onNewChat}>Создать чат</button>
          </li>
        )}
        {sorted.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          const title = chat.name || formatPhone(chat.phone) || chat.ids?.[0] || chat.id
          return (
            <li key={chat.id}>
              <button
                className={`chat-item ${chat.id === activeId ? 'active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <Avatar name={title} seed={chat.id} />
                <div className="chat-item-body">
                  <div className="chat-item-top">
                    <span className="chat-item-title">{title}</span>
                    {last && <span className="chat-item-time">{formatTime(last.ts)}</span>}
                  </div>
                  <div className="chat-item-bottom">
                    <span className="chat-item-preview">
                      {last ? (last.dir === 'out' ? 'Вы: ' : '') + last.text : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="sidebar-footer">
        <span className="muted">Инстанс {idInstance}</span>
        <button className="link-btn" onClick={onLogout}>Выйти</button>
      </footer>
    </aside>
  )
}
