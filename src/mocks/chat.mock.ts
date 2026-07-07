import type { ChatMessage } from '@/types/chat.types'
import type { ChatSuggestion } from '@/types/chat-suggestions.types'

import {
  MOCK_ANALYSIS_STEPS,
  MOCK_MEETING_SUMMARY_FIELDS,
  MOCK_MESSAGE_ATTACHMENTS,
  MOCK_MESSAGE_QUESTIONS,
  MOCK_MESSAGE_SELECTORS,
  MOCK_SUMMARY_ACTIONS,
} from './message.mock'

export const CHAT_TEXTBOX_PLACEHOLDER =
  "Ask AI Bot what to do – e.g 'Move sprint 12 blockers to Maya and notify the team'"

export const MOCK_CHAT_SUGGESTIONS: ChatSuggestion[] = [
  { id: 'sug-1', label: 'Client Details' },
  { id: 'sug-2', label: 'Create Meeting' },
  { id: 'sug-3', label: 'Invite member' },
  { id: 'sug-4', label: 'Tasks List' },
]

const BOT_ANALYSES = MOCK_ANALYSIS_STEPS

export const MOCK_CHAT_THREADS: Record<string, ChatMessage[]> = {
  'chat-1': [
    {
      id: 'chat-1-user-1',
      role: 'user',
      type: 'text',
      timestamp: '04:30 PM',
      content: { text: 'Invite Riya to the Q3 board meeting' },
    },
    {
      id: 'chat-1-bot-1',
      role: 'bot',
      type: 'summary',
      timestamp: '04:30 PM',
      content: {
        text: "Perfect — I've understood the meeting details",
        summaryTitle: 'Meeting Summary:',
        fields: MOCK_MEETING_SUMMARY_FIELDS,
        question: 'Would you like me to schedule this meeting?',
        actions: MOCK_SUMMARY_ACTIONS,
      },
    },
  ],
  'chat-2': [
    {
      id: 'chat-2-user-1',
      role: 'user',
      type: 'text',
      timestamp: '04:40 PM',
      content: { text: 'How can you create a board for Q3 prep' },
    },
    {
      id: 'chat-2-bot-1',
      role: 'bot',
      type: 'text',
      timestamp: '04:40 PM',
      analyses: BOT_ANALYSES,
      defaultAnalysesOpen: true,
      content: {
        text: `To create a board, start by choosing a board type (Sales, Rental, or Custom) and giving it a clear name that reflects its purpose.

Would you like me to walk you through setting up a new Sales or Rental board specifically?`,
      },
    },
  ],
  'chat-3': [
    {
      id: 'chat-3-user-1',
      role: 'user',
      type: 'text',
      timestamp: '04:40 PM',
      content: { text: 'Move sprint 12 blockers to Maya and notify the team' },
    },
    {
      id: 'chat-3-bot-1',
      role: 'bot',
      type: 'status',
      timestamp: '04:40 PM',
      analyses: BOT_ANALYSES,
      content: {
        text: 'I found 4 blockers in Sprint 12. I can reassign them to Maya Patel and notify the team on Slack.',
        tone: 'positive',
        questions: MOCK_MESSAGE_QUESTIONS,
      },
    },
  ],
  'chat-4': [
    {
      id: 'chat-4-user-1',
      role: 'user',
      type: 'text',
      timestamp: '04:40 PM',
      content: { text: 'Start vendor approval for Acme Supplies' },
    },
    {
      id: 'chat-4-bot-1',
      role: 'bot',
      type: 'selectors',
      timestamp: '04:40 PM',
      analyses: BOT_ANALYSES,
      content: {
        text: 'Pick the approval path you want to use for this vendor request.',
        selectors: MOCK_MESSAGE_SELECTORS,
      },
    },
    {
      id: 'chat-4-user-2',
      role: 'user',
      type: 'text',
      timestamp: '04:41 PM',
      content: { text: 'Share property documents' },
    },
    {
      id: 'chat-4-bot-2',
      role: 'bot',
      type: 'attachments',
      timestamp: '04:41 PM',
      content: {
        text: 'Here are the vendor documents attached to this approval flow.',
        attachments: MOCK_MESSAGE_ATTACHMENTS,
      },
    },
  ],
}

export function getMockChatMessages(chatId: string | undefined): ChatMessage[] {
  if (!chatId) return []
  return MOCK_CHAT_THREADS[chatId] ?? []
}

