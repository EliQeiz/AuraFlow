import { ExternalLink, MessageSquareMore, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { MobileDashboardNav, Sidebar } from '../../components/layout/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { asErrorMessage } from '../../lib/utils'
import { UserAvatar } from '../../components/shared/UserAvatar'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { admin, logout, profile, user } = useAuth()

  const signOut = async () => {
    try {
      await logout()
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }

  return (
    <section className="section-shell flex min-h-screen gap-4 py-4 sm:py-6">
      <Sidebar admin={admin} collapsed={collapsed} onLogout={signOut} />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav admin={admin} onLogout={signOut} />
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
            <Link to="/" className="hidden rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-100 hover:bg-cyan-300/10 sm:inline-flex sm:items-center sm:gap-2">
              <ExternalLink className="h-4 w-4" />
              Website
            </Link>
            <Link to="/dashboard/messages" className="rounded-md border border-white/10 p-3 text-white transition hover:border-cyan-100 hover:bg-cyan-300/10" aria-label="Open project messages">
              <MessageSquareMore className="h-4 w-4" />
            </Link>
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
