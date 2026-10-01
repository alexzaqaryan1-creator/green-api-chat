// Тонкая обёртка над GREEN-API (MAX, v3).
// Формат запросов: {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}

export function defaultApiUrl(idInstance) {
  const prefix = String(idInstance || '').trim().slice(0, 4)
  return /^\d{4}$/.test(prefix)
    ? `https://${prefix}.api.green-api.com`
    : 'https://api.green-api.com'
}

function buildUrl({ apiUrl, idInstance, apiTokenInstance }, method, suffix = '') {
  const base = apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`
}

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const msg = (data && data.message) || (typeof data === 'string' && data) || res.statusText
    const err = new Error(`${res.status}: ${msg}`)
    err.status = res.status
    throw err
  }
  return data
}

export function getStateInstance(creds) {
  return request(buildUrl(creds, 'getStateInstance'))
}

// https://green-api.com/v3/docs/api/sending/SendMessage/
export function sendMessage(creds, chatId, message) {
  return request(buildUrl(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

// https://green-api.com/v3/docs/api/receiving/technology-http-api/ReceiveNotification/
export function receiveNotification(creds, receiveTimeout = 5, signal) {
  return request(buildUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal })
}

// https://green-api.com/v3/docs/api/receiving/technology-http-api/DeleteNotification/
export function deleteNotification(creds, receiptId) {
  return request(buildUrl(creds, 'deleteNotification', `/${receiptId}`), { method: 'DELETE' })
}

// https://green-api.com/en/docs/api/service/CheckWhatsapp/
// Возвращает { existsWhatsapp, chatId } — chatId может быть в формате @lid
export function checkWhatsapp(creds, phone) {
  return request(buildUrl(creds, 'checkWhatsapp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: String(phone) }),
  })
}
