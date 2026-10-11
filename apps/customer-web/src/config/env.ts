/**
 * Environment configuration for Ksheeraam Customer Web.
 * Safely reads Vite environment variables with type-safe fallbacks.
 */

export const env = {
  // Base URL for the Express + MongoDB backend API (e.g., http://localhost:5000/api/v1)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  
  // Explicit toggle for mock mode: true during standalone UI development, false for live backend
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true',
  
  // WhatsApp support phone number (international format without '+' or spaces)
  WHATSAPP_PHONE: import.meta.env.VITE_WHATSAPP_PHONE || '919876543210',
  
  // Application branding
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Ksheeraam',
} as const;
