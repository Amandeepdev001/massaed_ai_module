import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { apiConfig, buildAssistantHeaders } from '@/config/api.config'
import { ASSISTANT_ENDPOINTS } from '@/constants/assistant-api.constants'
import type {
  AssistantActiveRunResponse,
  AssistantHistoryResponse,
  SendMessageRequest,
  StartAssistantRunResponse,
} from '@/types/assistant.api.types'

export const assistantApi = createApi({
  reducerPath: 'assistantApi',
  baseQuery: fetchBaseQuery({
    baseUrl: apiConfig.baseUrl,
    prepareHeaders: (headers) => {
      const withAuth = buildAssistantHeaders(headers)
      withAuth.forEach((value, key) => {
        headers.set(key, value)
      })
      return headers
    },
  }),
  tagTypes: ['AssistantHistory', 'AssistantActiveRun'],
  endpoints: (builder) => ({
    getAssistantHistory: builder.query<AssistantHistoryResponse, void>({
      query: () => ({
        url: ASSISTANT_ENDPOINTS.history,
      }),
      providesTags: ['AssistantHistory'],
    }),
    getActiveAssistantRun: builder.query<AssistantActiveRunResponse, void>({
      query: () => ({
        url: ASSISTANT_ENDPOINTS.activeRun,
      }),
      providesTags: ['AssistantActiveRun'],
    }),
    startAssistantRun: builder.mutation<
      StartAssistantRunResponse,
      Pick<SendMessageRequest, 'message'>
    >({
      query: ({ message }) => {
        const body: SendMessageRequest = { message }
        if (apiConfig.agencyId) body.agencyId = apiConfig.agencyId

        return {
          url: ASSISTANT_ENDPOINTS.messages,
          method: 'POST',
          body,
        }
      },
    }),
  }),
})

export const {
  useGetAssistantHistoryQuery,
  useGetActiveAssistantRunQuery,
  useStartAssistantRunMutation,
} = assistantApi
