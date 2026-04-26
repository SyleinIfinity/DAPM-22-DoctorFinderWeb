import type { AxiosError } from 'axios'

export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<any>
  const data = axiosError?.response?.data as any

  if (typeof data === 'string' && data.trim()) return data
  if (data?.message && typeof data.message === 'string') return data.message
  if (data?.detail && typeof data.detail === 'string') return data.detail
  if (axiosError?.message) return axiosError.message
  return 'Có lỗi xảy ra'
}

