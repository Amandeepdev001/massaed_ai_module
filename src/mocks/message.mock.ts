import type {
  AnalysisStepData,
  MessageActionOption,
  MessageAttachmentData,
  MessageQuestionOption,
  MessageSelectorOption,
  MessageSummaryField,
} from '@/types/message.types'

export const MOCK_ANALYSIS_STEPS: AnalysisStepData[] = [
  {
    id: 'step-1',
    title: 'Updating todo list',
    description: "In Progress- (High) Gathering Riya sachdeva's recent work activity",
  },
  {
    id: 'step-2',
    title: 'Updating todo list',
    description: "In Progress- (High) Gathering Riya sachdeva's recent work activity",
  },
]

export const MOCK_MESSAGE_ATTACHMENTS: MessageAttachmentData[] = [
  { id: 'attach-img-1', title: 'Floor plan.jpg', mediaType: 'image' },
  { id: 'attach-vid-1', title: 'Site walkthrough.mp4', mediaType: 'video' },
  {
    id: 'attach-doc-1',
    title: 'Vendor contract.pdf',
    mediaType: 'pdf',
    sizeLabel: '1.2 MB',
    typeLabel: 'PDF',
  },
]

export const MOCK_MESSAGE_QUESTIONS: MessageQuestionOption[] = [
  { id: 'no', label: 'No' },
  { id: 'yes', label: 'Yes' },
]

export const MOCK_MESSAGE_SELECTORS: MessageSelectorOption[] = [
  { id: 'selector-1', label: 'Standard approval' },
  { id: 'selector-2', label: 'Fast track' },
  { id: 'selector-3', label: 'Legal review' },
  { id: 'selector-4', label: 'Finance review' },
]

export const MOCK_MEETING_SUMMARY_FIELDS: MessageSummaryField[] = [
  { label: 'Title', value: 'Client Review Meeting' },
  { label: 'Participants', value: 'Aryan, Paras' },
  { label: 'Date', value: 'Tomorrow' },
  { label: 'Time', value: '4 PM' },
  { label: 'Platform', value: 'Google Meet' },
]

export const MOCK_SUMMARY_ACTIONS: MessageActionOption[] = [
  { id: 'yes-no', label: 'Yes / No' },
  { id: 'edit', label: 'Edit' },
]
