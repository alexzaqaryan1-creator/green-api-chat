import { useState } from 'react'
import { onlyDigits } from '../utils'

export default function NewChatModal({ onCreate, onClose }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    let digits = onlyDigits(phone)
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1)
    if (digits.length < 10 || digits.length > 15) {
      setError('Введите номер в международном формате, например 79991234567.')
      return
    }
    onCreate({ phone: digits, name: name.trim() })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Новый чат</h2>
        <label className="field">
          <span>Номер телефона получателя</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
            inputMode="tel"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Имя (необязательно)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван" />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="primary">Создать чат</button>
        </div>
      </form>
    </div>
  )
}
