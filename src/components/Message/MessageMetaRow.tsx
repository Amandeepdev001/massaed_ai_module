import { useEffect, useRef, useState } from 'react'

import { copyChatMessageText } from '@/utils/message-copy'

import { CheckIcon, CopyIcon, EditIcon } from '../icons'
import styles from './Message.module.css'

const COPIED_FEEDBACK_MS = 2000

function CopyMessageButton({
  copyText,
  onCopied,
}: {
  copyText: string
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current)
      }
    },
    [],
  )

  const handleCopy = async () => {
    const didCopy = await copyChatMessageText(copyText)
    if (!didCopy) return

    setCopied(true)
    onCopied?.()

    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
    }

    copiedTimeoutRef.current = window.setTimeout(() => {
      copiedTimeoutRef.current = null
      setCopied(false)
    }, COPIED_FEEDBACK_MS)
  }

  return (
    <button
      type="button"
      className={[
        styles['message-meta__btn'],
        copied ? styles['message-meta__btn--copied'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={copied ? 'Message copied' : 'Copy message'}
      onClick={() => void handleCopy()}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

export function MessageMetaRow({
  timestamp,
  variant,
  copyText,
  onCopied,
  onEdit,
}: {
  timestamp: string
  variant: 'user' | 'bot'
  copyText: string
  onCopied?: () => void
  onEdit?: () => void
}) {
  return (
    <div className={`${styles['message-meta']} ${styles[`message-meta--${variant}`]}`}>
      {variant === 'user' ? (
        <>
          <div className={styles['message-meta__actions']}>
            <CopyMessageButton copyText={copyText} onCopied={onCopied} />
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
            <CopyMessageButton copyText={copyText} onCopied={onCopied} />
          </div>
        </>
      )}
    </div>
  )
}
