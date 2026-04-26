export type RecentDoctor = {
  maBacSi: number
  hoTenDayDu: string
  chuyenKhoa: string
  tenCoSoYTe: string
  diaChiLamViec: string | null
  anhDaiDien: string | null
}

const STORAGE_KEY = 'recent_doctors_v1'
const MAX_ITEMS = 20

export function loadRecentDoctors(): RecentDoctor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentDoctor[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d) => !!d && Number.isFinite(d.maBacSi))
  } catch {
    return []
  }
}

function saveRecentDoctors(list: RecentDoctor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function clearRecentDoctors() {
  localStorage.removeItem(STORAGE_KEY)
}

export function saveRecentDoctor(doctor: RecentDoctor) {
  if (!doctor?.maBacSi) return
  const current = loadRecentDoctors()
  const next = [doctor, ...current.filter((d) => d.maBacSi !== doctor.maBacSi)].slice(0, MAX_ITEMS)
  saveRecentDoctors(next)
}
