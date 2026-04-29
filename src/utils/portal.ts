const PORTAL_KEY = 'finder_doctor_last_portal'

export type PortalTarget = 'member' | 'doctor'

export function getLastPortal(): PortalTarget | null {
  const raw = localStorage.getItem(PORTAL_KEY)
  if (raw === 'member' || raw === 'doctor') return raw
  return null
}

export function setLastPortal(next: PortalTarget) {
  localStorage.setItem(PORTAL_KEY, next)
}
