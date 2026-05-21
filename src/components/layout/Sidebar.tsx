import { FolderKanban, Home, LayoutTemplate, LogOut, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const dashboardLinks = [
  { label: 'Home', to: '/dashboard', Icon: Home },
  { label: 'My Projects', to: '/dashboard/projects', Icon: FolderKanban },
  { label: 'Templates', to: '/dashboard/templates', Icon: LayoutTemplate },
  { label: 'Settings', to: '/dashboard/settings', Icon: Settings },
]

export function Sidebar({ collapsed, onLogout }: { collapsed: boolean; onLogout: () => void }) {
  return (
    <aside className={cn('glass sticky top-24 hidden h-[calc(100vh-7rem)] rounded-lg p-3 md:block', collapsed ? 'w-20' : 'w-64')}>
      <div className="grid gap-1">
        {dashboardLinks.map(({ Icon, label, to }) => (
          <NavLink
            key={to}
            end={to === '/dashboard'}
            to={to}
            className={({ isActive }) =>
              cn('flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-aura-muted transition hover:bg-white/10 hover:text-white', isActive && 'bg-cyan-300/10 text-white')
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {collapsed ? null : label}
          </NavLink>
        ))}
        <button onClick={onLogout} className="mt-3 flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-aura-muted transition hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4 shrink-0" />
          {collapsed ? null : 'Logout'}
        </button>
      </div>
    </aside>
  )
}
