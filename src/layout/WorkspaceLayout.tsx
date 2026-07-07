import type { ReactNode } from 'react'

import styles from './WorkspaceLayout.module.css'

export function WorkspaceLayout({ sidebar, children }: { sidebar?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles['ai-app']}>
      <div className={styles.workspace}>
        {sidebar ? <aside className={styles.sidebar}>{sidebar}</aside> : null}
        {children}
      </div>
    </div>
  )
}

