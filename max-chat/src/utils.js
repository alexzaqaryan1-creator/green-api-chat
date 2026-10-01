export const onlyDigits = (s) => String(s || '').replace(/\D/g, '')

export function formatPhone(digits) {
  const d = onlyDigits(digits)
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`
  }
  return d ? `+${d}` : ''
}

export function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

const AVATAR_COLORS = ['#4C6FFF', '#8A4DFF', '#00A3A3', '#F0784A', '#E0457B', '#2E9E5B', '#C7962A']
export function avatarColor(key) {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(name) {
  const clean = String(name || '').replace(/[^\p{L}\p{N} ]/gu, '').trim()
  if (!clean) return '#'
  const parts = clean.split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

// Достаём текст из messageData входящего/исходящего уведомления
export function extractText(md) {
  if (!md) return null
  switch (md.typeMessage) {
    case 'textMessage':
      return md.textMessageData?.textMessage ?? null
    case 'extendedTextMessage':
    case 'quotedMessage':
      return md.extendedTextMessageData?.text ?? md.textMessageData?.textMessage ?? null
    default:
      return null
  }
}

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}
