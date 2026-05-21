import { Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Sidebar } from '../../components/layout/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { asErrorMessage, getInitials } from '../../lib/utils'

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
    <section className="section-shell flex gap-4 pb-20 pt-28">
      <Sidebar collapsed={collapsed} onLogout={signOut} />
      <div className="min-w-0 flex-1">
        <header className="glass mb-5 flex items-center justify-between gap-3 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="hidden min-h-0 p-2 md:inline-flex" onClick={() => setCollapsed((current) => !current)} aria-label="Collapse dashboard sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
            <div>
              <p className="text-sm text-aura-muted">Client dashboard</p>
              <strong className="font-syne text-white">{profile?.name ?? user?.displayName ?? 'AuraFlow Client'}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-white/10 p-3 text-white" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-aura-gradient font-bold text-white">
              {profile?.avatarUrl || user?.photoURL ? (
                <img src={profile?.avatarUrl ?? user?.photoURL ?? ''} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(profile?.name ?? user?.displayName)
              )}
            </span>
          </div>
        </header>
        <Outlet />
      </div>
    </section>
  )
}
