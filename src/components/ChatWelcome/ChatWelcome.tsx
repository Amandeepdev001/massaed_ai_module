import { BotAvatar } from '../BotAvatar/BotAvatar'
import styles from './ChatWelcome.module.css'

export function ChatWelcome({ name }: { name?: string }) {
  return (
    <div className={styles['chat-welcome']}>
      <div className={styles['chat-welcome__inner']}>
        <BotAvatar size="lg" />
        <div>
          <h2 className={styles['chat-welcome__title']}>{name ? `Welcome, ${name}` : 'Welcome'}</h2>
          <p className={styles['chat-welcome__subtitle']}>Your AI Workspace Assistant</p>
        </div>
      </div>
    </div>
  )
}

