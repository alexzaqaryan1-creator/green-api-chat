import { useState } from 'react'
import { defaultApiUrl, getStateInstance } from '../api/greenApi'

export default function Login({ onLogin }) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiToken] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const effectiveUrl = apiUrl.trim() || defaultApiUrl(idInstance)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: effectiveUrl,
    }
    if (!creds.idInstance || !creds.apiTokenInstance) {
      setError('Введите idInstance и apiTokenInstance из личного кабинета GREEN-API.')
      return
    }
    setLoading(true)
    try {
      const state = await getStateInstance(creds)
      if (state?.stateInstance !== 'authorized') {
        setError(
          `Инстанс в статусе «${state?.stateInstance ?? 'unknown'}». Авторизуйте аккаунт (QR-код) в консоли GREEN-API и попробуйте снова.`
        )
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(
        err.status === 401 || err.status === 403
          ? 'Неверный idInstance или apiTokenInstance.'
          : `Не удалось подключиться к ${creds.apiUrl}. Проверьте данные и apiUrl. (${err.message})`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo" aria-hidden="true">M</div>
        <h1>Вход в чат</h1>
        <p className="muted">Данные инстанса возьмите в личном кабинете console.green-api.com</p>

        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="3100123456"
            inputMode="numeric"
            autoFocus
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd451234"
            type="password"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>apiUrl (из карточки инстанса)</span>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder={defaultApiUrl(idInstance)}
          />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
