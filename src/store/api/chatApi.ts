import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { apiConfig } from '@/config/api.config'
import type { ChatHistoryResponse, ChatRequest, ChatResponse } from '@/types/conversation.api.types'

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiConfig.baseUrl,
  }),
  tagTypes: ['ChatHistory'],
  endpoints: (builder) => ({
    getChatHistory: builder.query<ChatHistoryResponse, void>({
      query: () => ({
        url: '/v1/ai/chat/history',
        params: {
          userId: apiConfig.userId,
          spaceId: apiConfig.spaceId,
        },
      }),
      providesTags: ['ChatHistory'],
    }),
    sendChatMessage: builder.mutation<ChatResponse, Pick<ChatRequest, 'message'>>({
      query: ({ message }) => ({
        url: '/v1/ai/chat',
        method: 'POST',
        body: {
          message,
          userId: apiConfig.userId,
          spaceId: apiConfig.spaceId,
        } satisfies ChatRequest,
      }),
    }),
  }),
})

export const { useGetChatHistoryQuery, useSendChatMessageMutation } = chatApi
