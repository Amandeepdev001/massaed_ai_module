import { CopyIcon, EditIcon } from './icons'

export function MessageMetaRow({
  timestamp,
  variant,
  onCopy,
  onEdit,
}: {
  timestamp: string
  variant: 'user' | 'bot'
  onCopy?: () => void
  onEdit?: () => void
}) {
  return (
    <div className={`message-meta message-meta--${variant}`}>
      {variant === 'user' ? (
        <>
          <div className="message-meta__actions">
            <button type="button" className="message-meta__btn" aria-label="Copy message" onClick={onCopy}>
              <CopyIcon />
            </button>
            {onEdit ? (
              <button type="button" className="message-meta__btn" aria-label="Edit message" onClick={onEdit}>
                <EditIcon />
              </button>
            ) : null}
          </div>
          <time className="message-meta__time">{timestamp}</time>
        </>
      ) : (
        <>
          <time className="message-meta__time">{timestamp}</time>
          <div className="message-meta__actions">
            <button type="button" className="message-meta__btn" aria-label="Copy message" onClick={onCopy}>
              <CopyIcon />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
