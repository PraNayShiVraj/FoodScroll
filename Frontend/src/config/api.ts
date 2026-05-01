// Central API configuration — single source of truth for the backend URL.
// In development, falls back to localhost:3000.
// In production, set VITE_API_URL in your .env or hosting provider's env settings.

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
