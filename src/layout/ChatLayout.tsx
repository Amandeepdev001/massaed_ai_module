import type { ReactNode } from 'react'

import styles from './ChatLayout.module.css'

export function ChatLayout({ children }: { children: ReactNode }) {
  return <main className={styles['chat-layout']}>{children}</main>
}

