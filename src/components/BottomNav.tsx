import { NavLink } from 'react-router-dom'

export type BottomNavItem = {
  to: string
  label: string
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-item nav-item-active' : 'nav-item'
            }
          >
            <span style={{ fontWeight: 800, fontSize: 12 }}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

