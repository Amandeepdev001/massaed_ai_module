import { useEffect, useState } from 'react'
import styles from './TypingIndicator.module.css'

const DOT_COUNT = 3
const DOT_STEP_MS = 400

export function TypingIndicator() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % DOT_COUNT)
    }, DOT_STEP_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <span className={styles['typing-indicator']} role="status" aria-label="Ai Bot is typing">
      {Array.from({ length: DOT_COUNT }).map((_, index) => (
        <span
          key={index}
          className={`${styles['typing-indicator__dot']} ${reduceMotion || index === activeIndex ? styles['is-active'] : ''}`}
          aria-hidden
        />
      ))}
    </span>
  )
}

