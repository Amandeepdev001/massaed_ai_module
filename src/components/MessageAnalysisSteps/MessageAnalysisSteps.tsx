import type { AnalysisStepData } from '@/types/message.types'

import { AnalysisMarkerIcon } from '../icons'
import styles from './MessageAnalysisSteps.module.css'

export function MessageAnalysisSteps({ steps }: { steps: AnalysisStepData[] }) {
  if (steps.length === 0) return null

  return (
    <ol className={styles['analysis-steps']}>
      {steps.map((step, index) => (
        <li key={`${step.id}-${index}`} className={styles['analysis-step']}>
          <span className={styles['analysis-step__marker']}>
            <AnalysisMarkerIcon />
          </span>
          <div>
            <p className={styles['analysis-step__title']}>{step.title}</p>
            <p className={styles['analysis-step__desc']}>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

