import { Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { MobileDashboardNav, Sidebar } from '../../components/layout/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { asErrorMessage } from '../../lib/utils'
import { UserAvatar } from '../../components/shared/UserAvatar'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { logout, profile, user } = useAuth()

  const signOut = async () => {
    try {
      await logout()
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }

  return (
    <section className="section-shell flex gap-4 pb-20 pt-24 sm:pt-28">
      <Sidebar collapsed={collapsed} onLogout={signOut} />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav onLogout={signOut} />
        <header className="glass mb-5 flex items-center justify-between gap-3 rounded-lg p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="secondary" className="hidden min-h-0 p-2 md:inline-flex" onClick={() => setCollapsed((current) => !current)} aria-label="Collapse dashboard sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <div className="min-w-0">
              <p className="text-sm text-aura-muted">Client dashboard</p>
              <strong className="block truncate font-syne text-white">{profile?.name ?? user?.displayName ?? 'AuraFlow Client'}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-white/10 p-3 text-white" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <UserAvatar
              className="h-11 w-11 rounded-lg"
              name={profile?.name ?? user?.displayName}
              src={profile?.avatarUrl ?? user?.photoURL}
            />
          </div>
        </header>
        <Outlet />
      </div>
    </section>
  )
}
