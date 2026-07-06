import { MagicWandIcon } from './icons'

export function BotAvatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div
      className={`bot-avatar bot-avatar--${size}`}
      role="img"
      aria-label="Ai Bot"
    >
      <MagicWandIcon />
    </div>
  )
}
