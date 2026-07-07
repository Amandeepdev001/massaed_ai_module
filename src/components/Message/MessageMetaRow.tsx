import { CopyIcon, EditIcon } from '../icons'
import styles from './Message.module.css'

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
    <div className={`${styles['message-meta']} ${styles[`message-meta--${variant}`]}`}>
      {variant === 'user' ? (
        <>
          <div className={styles['message-meta__actions']}>
            <button type="button" className={styles['message-meta__btn']} aria-label="Copy message" onClick={onCopy}>
              <CopyIcon />
            </button>
            {onEdit ? (
              <button type="button" className={styles['message-meta__btn']} aria-label="Edit message" onClick={onEdit}>
                <EditIcon />
              </button>
            ) : null}
          </div>
          <time className={styles['message-meta__time']}>{timestamp}</time>
        </>
      ) : (
        <>
          <time className={styles['message-meta__time']}>{timestamp}</time>
          <div className={styles['message-meta__actions']}>
            <button type="button" className={styles['message-meta__btn']} aria-label="Copy message" onClick={onCopy}>
              <CopyIcon />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

