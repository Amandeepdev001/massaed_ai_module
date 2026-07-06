import type { ReactNode } from 'react'

export function ChatLayout({ children }: { children: ReactNode }) {
  return <main className="chat-layout">{children}</main>
}
