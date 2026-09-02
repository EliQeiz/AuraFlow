import { FolderKanban, Globe2, Home, LayoutTemplate, LogOut, MessagesSquare, MessageSquareMore, PlusCircle, Shield, SlidersHorizontal, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const dashboardLinks = [
  { label: 'Home', to: '/dashboard', Icon: Home },
  { label: 'New Request', to: '/dashboard/requests/new', Icon: PlusCircle },
  { label: 'Suite Builder', to: '/dashboard/studio', Icon: SlidersHorizontal },
  { label: 'Requests', to: '/dashboard/requests', Icon: MessageSquareMore },
  { label: 'Messages', to: '/dashboard/messages', Icon: MessagesSquare },
  { label: 'Templates', to: '/dashboard/templates', Icon: LayoutTemplate },
  { label: 'Settings', to: '/dashboard/settings', Icon: Settings },
]

const utilityLinks = [{ label: 'Website', to: '/', Icon: Globe2 }]

export function Sidebar({ admin, collapsed, onLogout }: { admin: boolean; collapsed: boolean; onLogout: () => void }) {
  return (
    <aside className={cn('glass sticky top-4 hidden h-[calc(100vh-2rem)] rounded-lg p-3 md:block', collapsed ? 'w-20' : 'w-64')}>
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
        {admin ? <DashboardLink collapsed={collapsed} Icon={Shield} label="Admin" to="/dashboard/admin" /> : null}
        <div className="my-2 border-t border-white/10" />
        {utilityLinks.map(({ Icon, label, to }) => (
          <DashboardLink key={to} collapsed={collapsed} Icon={Icon} label={label} to={to} />
        ))}
        <button onClick={onLogout} className="mt-3 flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-aura-muted transition hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4 shrink-0" />
          {collapsed ? null : 'Logout'}
        </button>
      </div>
    </aside>
  )
}

export function MobileDashboardNav({ admin, onLogout }: { admin: boolean; onLogout: () => void }) {
  return (
    <nav aria-label="Dashboard" className="glass mb-4 overflow-x-auto rounded-lg p-2 md:hidden">
      <div className="flex min-w-max items-center gap-1">
        {dashboardLinks.map(({ Icon, label, to }) => (
          <NavLink
            key={to}
            end={to === '/dashboard'}
            to={to}
            className={({ isActive }) =>
              cn(
                'inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm text-aura-muted transition hover:bg-white/10 hover:text-white',
                isActive && 'bg-cyan-300/10 text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
        {admin ? <DashboardLink Icon={Shield} label="Admin" to="/dashboard/admin" /> : null}
        <DashboardLink Icon={Globe2} label="Website" to="/" />
        <button onClick={onLogout} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm text-aura-muted transition hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </nav>
  )
}

function DashboardLink({
  collapsed,
  Icon,
  label,
  to,
}: {
  collapsed?: boolean
  Icon: typeof FolderKanban
  label: string
  to: string
}) {
  return (
    <NavLink
      end={to === '/dashboard'}
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm text-aura-muted transition hover:bg-white/10 hover:text-white md:flex md:gap-3',
          isActive && 'bg-cyan-300/10 text-white',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {collapsed ? null : label}
    </NavLink>
  )
}
