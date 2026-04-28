import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { createInitials } from '../pages/doctor/doctorUi'

export type SidebarNavItem = {
  to: string
  label: string
}

export function DoctorSidebar({ items }: { items: SidebarNavItem[] }) {
  const { session } = useAuth()
  const name = session?.tenDangNhap ?? 'Doctor'

  return (
    <aside className="doctor-sidebar">
      <div className="doctor-sidebar__header">
        <div className="doctor-sidebar__logo">
          <div className="doctor-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
            {createInitials(name)}
          </div>
          <span className="doctor-sidebar__title">DoctorSpace</span>
        </div>
      </div>
      <nav className="doctor-sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'doctor-sidebar-item doctor-sidebar-item--active' : 'doctor-sidebar-item'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="doctor-sidebar__footer">
        <div className="doctor-sidebar-version">v2.1.0 Pro</div>
      </div>
    </aside>
  )
}
