import { useEffect, useRef } from 'react'
import { receiveNotification, deleteNotification } from '../api/greenApi'

// Цикл получения уведомлений по технологии HTTP API:
// receiveNotification (long polling) -> обработка -> deleteNotification -> снова.
export function useNotifications(creds, onNotification) {
  const handlerRef = useRef(onNotification)
  handlerRef.current = onNotification

  useEffect(() => {
    if (!creds) return
    const controller = new AbortController()
    let stopped = false
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

    async function loop() {
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds, 5, controller.signal)
          if (stopped) break
          if (notification && notification.receiptId) {
            try {
              handlerRef.current(notification.body)
            } catch (e) {
              console.error('Ошибка обработки уведомления', e)
            }
            await deleteNotification(creds, notification.receiptId)
          }
        } catch (e) {
          if (stopped || e.name === 'AbortError') break
          console.warn('receiveNotification error:', e.message)
          await sleep(3000)
        }
      }
    }

    loop()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [creds])
}
