import { configureStore } from '@reduxjs/toolkit'

import { assistantApi } from './api/assistantApi'

export const store = configureStore({
  reducer: {
    [assistantApi.reducerPath]: assistantApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(assistantApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
