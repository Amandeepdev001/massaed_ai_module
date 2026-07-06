import type {
  MessageActionOption,
  MessageAttachmentData,
  MessageQuestionOption,
  MessageSelectorOption,
  MessageSummaryField,
  MessageTableData,
  MessageTone,
} from './message.types'

export type BotResponseType =
  | 'text'
  | 'table'
  | 'attachments'
  | 'status'
  | 'selectors'
  | 'summary'
  | 'typing'

type ChatMessageBase = {
  id: string
  timestamp: string
}

export type UserChatMessage = ChatMessageBase & {
  role: 'user'
  type: 'text'
  content: { text: string }
}

type BotChatMessageBase = ChatMessageBase & {
  role: 'bot'
  botName?: string
  analyses?: import('./message.types').AnalysisStepData[]
  defaultAnalysesOpen?: boolean
}

export type BotTextChatMessage = BotChatMessageBase & {
  type: 'text'
  content: { text: string }
}

export type BotTableChatMessage = BotChatMessageBase & {
  type: 'table'
  content: { text: string; table: MessageTableData }
}

export type BotAttachmentsChatMessage = BotChatMessageBase & {
  type: 'attachments'
  content: { text: string; attachments: MessageAttachmentData[] }
}

export type BotStatusChatMessage = BotChatMessageBase & {
  type: 'status'
  content: {
    text: string
    tone: MessageTone
    questions?: MessageQuestionOption[]
  }
}

export type BotSelectorsChatMessage = BotChatMessageBase & {
  type: 'selectors'
  content: { text: string; selectors: MessageSelectorOption[] }
}

export type BotSummaryChatMessage = BotChatMessageBase & {
  type: 'summary'
  content: {
    text: string
    summaryTitle: string
    fields: MessageSummaryField[]
    question?: string
    actions?: MessageActionOption[]
  }
}

export type BotTypingChatMessage = BotChatMessageBase & {
  type: 'typing'
  content?: undefined
}

export type BotChatMessage =
  | BotTextChatMessage
  | BotTableChatMessage
  | BotAttachmentsChatMessage
  | BotStatusChatMessage
  | BotSelectorsChatMessage
  | BotSummaryChatMessage
  | BotTypingChatMessage

export type ChatMessage = UserChatMessage | BotChatMessage

export type ChatMessageHandlers = {
  onQuestionSelect?: (messageId: string, optionId: string) => void
  onSelectorSelect?: (messageId: string, selectorId: string) => void
  onActionSelect?: (messageId: string, actionId: string) => void
  onCopy?: (messageId: string) => void
  onEdit?: (messageId: string) => void
}
