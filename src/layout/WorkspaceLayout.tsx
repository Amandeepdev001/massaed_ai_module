import type { ReactNode } from 'react'

export function WorkspaceLayout({ sidebar, children }: { sidebar?: ReactNode; children: ReactNode }) {
  return (
    <div className="ai-app">
      <div className="workspace">
        {sidebar ? <aside className="sidebar">{sidebar}</aside> : null}
        {children}
      </div>
    </div>
  )
}
