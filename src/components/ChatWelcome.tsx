import { BotAvatar } from './BotAvatar'

export function ChatWelcome({ name }: { name?: string }) {
  return (
    <div className="chat-welcome">
      <div className="chat-welcome__inner">
        <BotAvatar size="lg" />
        <div>
          <h2 className="chat-welcome__title">{name ? `Welcome, ${name}` : 'Welcome'}</h2>
          <p className="chat-welcome__subtitle">Your AI Workspace Assistant</p>
        </div>
      </div>
    </div>
  )
}
