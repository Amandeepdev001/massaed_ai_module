import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { apiConfig, buildAssistantHeaders } from '@/config/api.config'
import { ASSISTANT_ENDPOINTS } from '@/constants/assistant-api.constants'
import type {
  AssistantActiveRunResponse,
  OpenAssistantSessionRequest,
  OpenAssistantSessionResponse,
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
  tagTypes: ['AssistantActiveRun'],
  endpoints: (builder) => ({
    /** Opens session; purge only on refresh / reopen (keeps AI context otherwise). */
    openAssistantSession: builder.mutation<
      OpenAssistantSessionResponse,
      OpenAssistantSessionRequest | void
    >({
      query: (arg) => ({
        url: ASSISTANT_ENDPOINTS.sessionOpen,
        method: 'POST',
        body: { purge: arg?.purge === true },
      }),
      invalidatesTags: ['AssistantActiveRun'],
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
  useOpenAssistantSessionMutation,
  useGetActiveAssistantRunQuery,
  useStartAssistantRunMutation,
} = assistantApi
