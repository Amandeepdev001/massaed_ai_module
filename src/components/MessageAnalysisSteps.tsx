import type { AnalysisStepData } from '@/types/message.types'

import { AnalysisMarkerIcon } from './icons'

export function MessageAnalysisSteps({ steps }: { steps: AnalysisStepData[] }) {
  if (steps.length === 0) return null

  return (
    <ol className="analysis-steps">
      {steps.map((step, index) => (
        <li key={`${step.id}-${index}`} className="analysis-step">
          <span className="analysis-step__marker">
            <AnalysisMarkerIcon />
          </span>
          <div>
            <p className="analysis-step__title">{step.title}</p>
            <p className="analysis-step__desc">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
