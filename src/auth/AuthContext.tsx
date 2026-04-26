import React, { createContext, useContext, useMemo, useState } from 'react'
import type { LoginResponse } from '../api/types'

export type AuthSession = {
  maTaiKhoan: number
  tenDangNhap: string
  vaiTro: string
  trangThaiHoatDong: string
  maNguoiDung: number | null
  maBacSi: number | null
}

type AuthContextValue = {
  session: AuthSession | null
  setSessionFromLogin: (response: LoginResponse) => void
  logout: () => void
}

const STORAGE_KEY = 'finder_doctor_auth_v1'

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.maTaiKhoan) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const value: AuthContextValue = useMemo(
    () => ({
      session,
      setSessionFromLogin: (response) => {
        if (!response?.authenticated) throw new Error('Đăng nhập thất bại')
        if (!response.maTaiKhoan || !response.tenDangNhap || !response.vaiTro || !response.trangThaiHoatDong) {
          throw new Error('Response đăng nhập thiếu dữ liệu')
        }

        const next: AuthSession = {
          maTaiKhoan: response.maTaiKhoan,
          tenDangNhap: response.tenDangNhap,
          vaiTro: response.vaiTro,
          trangThaiHoatDong: response.trangThaiHoatDong,
          maNguoiDung: response.maNguoiDung ?? null,
          maBacSi: response.maBacSi ?? null,
        }

        setSession(next)
        saveSession(next)
      },
      logout: () => {
        setSession(null)
        saveSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải được dùng trong AuthProvider')
  }
  return ctx
}

