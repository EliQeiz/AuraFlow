import {
  ChevronRight,
  Bell,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Home,
  Store,
  Building2,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquare,
  PenTool,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Brand } from '../../components/shared/Brand'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { asErrorMessage } from '../../lib/utils'

const navigation = [
  { to: '/dashboard', label: 'Overview', Icon: Home, end: true },
  { to: '/dashboard/requests', label: 'Projects', Icon: FolderKanban },
  { to: '/studio', label: 'Studio Lab', Icon: PenTool },
  { to: '/dashboard/businesses', label: 'Business systems', Icon: Store },
  { to: '/dashboard/business-center', label: 'Business Center', Icon: Building2 },
  {
    to: '/dashboard/templates',
    label: 'Template library',
    Icon: LayoutTemplate,
  },
  { to: '/afc/learn', label: 'AuraFlow Class', Icon: GraduationCap },
  { to: '/dashboard/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/dashboard/activity', label: 'Activity inbox', Icon: Bell },
]
function WorkspaceSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, profile, admin, logout } = useAuth()
  const [pending, setPending] = useState(false)
  async function signOut() {
    setPending(true)
    try {
      await logout()
    } catch (err) {
      toast.error(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <aside className="workspace-sidebar">
      <Brand to="/dashboard" />
      <Link
        className="af-button af-button--primary mx-1 mb-2"
        to="/dashboard/requests/new"
        onClick={onNavigate}
      >
        Create a project
      </Link>
      <p className="workspace-label">Workspace</p>
      <nav className="workspace-nav" aria-label="Workspace navigation">
        {navigation.map(({ to, label, Icon, end }) => (
          <NavLink onClick={onNavigate} end={end} to={to} key={to}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      {admin && (
        <>
          <p className="workspace-label">Manage</p>
          <nav className="workspace-nav">
            <NavLink to="/dashboard/admin" onClick={onNavigate}>
              <ShieldCheck />
              Admin console
            </NavLink>
          </nav>
        </>
      )}
      <div className="workspace-sidebar-bottom">
        <nav className="workspace-nav">
          <NavLink to="/dashboard/settings" onClick={onNavigate}>
            <Settings2 />
            Settings
          </NavLink>
          <Link to="/" onClick={onNavigate}>
            <ExternalLink />
            Visit website
          </Link>
        </nav>
        <div className="account-row">
          <UserAvatar
            className="h-8 w-8 rounded-full"
            name={profile?.name ?? user?.displayName}
            src={profile?.avatarUrl ?? user?.photoURL}
          />
          <div>
            <strong>
              {profile?.name ?? user?.displayName ?? 'Your account'}
            </strong>
            <small>{admin ? 'Owner account' : 'Client account'}</small>
            <small title={user?.email || ''}>{user?.email}</small>
          </div>
          <button
            className="icon-button"
            title="Sign out"
            aria-label="Sign out"
            disabled={pending}
            onClick={signOut}
          >
            <LogOut />
          </button>
        </div>
      </div>
    </aside>
  )
}
export default function DashboardLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const title = location.pathname.includes('/admin')
    ? 'Administration'
    : location.pathname.includes('/settings')
      ? 'Settings'
      : ([...navigation]
          .reverse()
          .find((item) => location.pathname.startsWith(item.to))?.label ??
        'Workspace')
  const { profileError, refreshProfile, profile } = useAuth()
  const { setTheme } = useTheme()
  useEffect(() => {
    // Existing profiles may still carry AuraFlow's retired dark-first default.
    // Only a saved v3 choice can override the new light-first baseline here.
    if (window.localStorage.getItem('auraflow-theme-v3')) return
    if (profile?.theme === 'light') setTheme('light')
  }, [profile?.theme, setTheme])
  return (
    <div className="workspace">
      <WorkspaceSidebar />
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="breadcrumb">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  className="icon-button mobile-workspace-toggle"
                  aria-label="Open workspace menu"
                >
                  <Menu />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <Dialog.Content className="fixed left-0 top-0 z-50 w-[280px] outline-none">
                  <Dialog.Title className="sr-only">
                    Workspace navigation
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Projects, studio, messages and account settings.
                  </Dialog.Description>
                  <WorkspaceSidebar onNavigate={() => setOpen(false)} />
                  <Dialog.Close
                    className="icon-button absolute right-2 top-5"
                    aria-label="Close workspace menu"
                  >
                    <X />
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="workspace-topbar-actions">
            <Link
              className="icon-button"
              to="/dashboard/activity"
              title="Activity inbox"
              aria-label="Activity inbox"
            >
              <Bell />
            </Link>
            <Link
              className="topbar-support text-aura-muted"
              to="/dashboard/messages"
            >
              Contact AuraFlow
            </Link>
            <Link
              className="icon-button"
              to="/dashboard/messages"
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare />
            </Link>
          </div>
        </header>
        {profileError && (
          <div
            className="inline-alert m-4 flex flex-wrap justify-between gap-3"
            role="alert"
          >
            <span>{profileError}</span>
            <button
              className="auth-text-link"
              onClick={() =>
                void refreshProfile().catch((err) =>
                  toast.error(asErrorMessage(err)),
                )
              }
            >
              Retry
            </button>
          </div>
        )}
        <main id="workspace-content" className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
