import { avatarColor, initials } from '../utils'

export default function Avatar({ name, seed, size = 48 }) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: avatarColor(seed || name), fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
