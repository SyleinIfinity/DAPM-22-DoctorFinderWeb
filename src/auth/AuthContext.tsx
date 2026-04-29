import React, { createContext, useContext, useMemo, useState } from "react";
import type { LoginResponse } from "../api/types";
import {
  getLastPortal,
  setLastPortal,
  type PortalTarget,
} from "../utils/portal";

export type AuthSession = {
  maTaiKhoan: number;
  tenDangNhap: string;
  vaiTro: string;
  trangThaiHoatDong: string;
  maNguoiDung: number | null;
  maBacSi: number | null;
  activePortal: PortalTarget;
};

type AuthContextValue = {
  session: AuthSession | null;
  setSessionFromLogin: (
    response: LoginResponse,
    portal?: PortalTarget,
  ) => AuthSession;
  setActivePortal: (portal: PortalTarget) => void;
  logout: () => void;
};

const STORAGE_KEY = "finder_doctor_auth_v1";

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed?.maTaiKhoan) return null;
    const activePortal =
      parsed.activePortal === "doctor" || parsed.activePortal === "member"
        ? parsed.activePortal
        : (getLastPortal() ?? "member");

    return {
      maTaiKhoan: parsed.maTaiKhoan,
      tenDangNhap: parsed.tenDangNhap ?? "",
      vaiTro: parsed.vaiTro ?? "",
      trangThaiHoatDong: parsed.trangThaiHoatDong ?? "",
      maNguoiDung: parsed.maNguoiDung ?? null,
      maBacSi: parsed.maBacSi ?? null,
      activePortal,
    };
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function applyPortalClass(portal: PortalTarget | null) {
  try {
    const root = document.documentElement;
    root.classList.remove("portal-member", "portal-doctor");
    if (portal) root.classList.add(`portal-${portal}`);
  } catch {
    // ignore (server-side or restricted env)
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolvePortal(
  response: LoginResponse,
  preferredPortal?: PortalTarget,
): PortalTarget {
  const role = (response.vaiTro || "").toUpperCase();
  const doctorAvailable = role === "BAC_SI" || response.maBacSi != null;

  if (!doctorAvailable) return "member";
  if (preferredPortal === "doctor") return "doctor";

  const lastPortal = getLastPortal();
  if (lastPortal === "doctor") return "doctor";
  return "member";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadSession(),
  );

  const value: AuthContextValue = useMemo(
    () => ({
      session,
      setSessionFromLogin: (response, portal) => {
        if (!response?.authenticated) throw new Error("Đăng nhập thất bại");
        if (
          !response.maTaiKhoan ||
          !response.tenDangNhap ||
          !response.vaiTro ||
          !response.trangThaiHoatDong
        ) {
          throw new Error("Response đăng nhập thiếu dữ liệu");
        }

        const activePortal = resolvePortal(response, portal);

        const next: AuthSession = {
          maTaiKhoan: response.maTaiKhoan,
          tenDangNhap: response.tenDangNhap,
          vaiTro: response.vaiTro,
          trangThaiHoatDong: response.trangThaiHoatDong,
          maNguoiDung: response.maNguoiDung ?? null,
          maBacSi: response.maBacSi ?? null,
          activePortal,
        };

        setSession(next);
        saveSession(next);
        setLastPortal(activePortal);
        applyPortalClass(activePortal);
        return next;
      },
      setActivePortal: (portal) => {
        setSession((current) => {
          if (!current) return current;
          const next = { ...current, activePortal: portal };
          saveSession(next);
          setLastPortal(portal);
          applyPortalClass(portal);
          return next;
        });
      },
      logout: () => {
        setSession(null);
        saveSession(null);
        applyPortalClass(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng trong AuthProvider");
  }
  return ctx;
}
