import { MagicWandIcon } from '../icons'
import styles from './BotAvatar.module.css'

export function BotAvatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div
      className={`${styles['bot-avatar']} ${styles[`bot-avatar--${size}`]}`}
      role="img"
      aria-label="Ai Bot"
    >
      <MagicWandIcon />
    </div>
  )
}

