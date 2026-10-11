export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Ksheeraam Operations',
} as const;
