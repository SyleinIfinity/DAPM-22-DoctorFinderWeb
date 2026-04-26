export function getApiBaseUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (!raw || typeof raw !== 'string') {
    throw new Error('Thiếu VITE_API_BASE_URL. Hãy tạo file `.env` và set VITE_API_BASE_URL=<base-url>.')
  }
  return raw.replace(/\/+$/, '')
}

