export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  userId: import.meta.env.VITE_USER_ID ?? '123456',
  spaceId: import.meta.env.VITE_SPACE_ID ?? '123456',
} as const
