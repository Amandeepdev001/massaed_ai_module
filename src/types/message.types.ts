export type AnalysisStepData = {
  id: string
  title: string
  description: string
}

export type MessageAttachmentData = {
  id: string
  title: string
  mediaType: 'image' | 'video' | 'pdf'
  sizeLabel?: string
  typeLabel?: string
}

export type MessageTableData = {
  supportingText?: string
  columns: string[]
  rows: string[][]
}

export type MessageTone = 'negative' | 'positive'

export type MessageQuestionOption = {
  id: string
  label: string
}

export type MessageSelectorOption = {
  id: string
  label: string
}

export type MessageSummaryField = {
  label: string
  value: string
}

export type MessageActionOption = {
  id: string
  label: string
}
