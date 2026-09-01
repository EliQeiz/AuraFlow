import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { asErrorMessage } from '../../lib/utils'
import { UserAvatar } from '../shared/UserAvatar'
import { ButtonLink } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

const links = [
  ['Home', '/'],
  ['Services', '/services'],
  ['Solutions', '/solutions'],
  ['Templates', '/templates'],
  ['Portfolio', '/portfolio'],
  ['Pricing', '/pricing'],
  ['Blog', '/blog'],
  ['About', '/about'],
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { logout, profile, user } = useAuth()

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const logoutNow = async () => {
    try {
      await logout()
      toast.success('Logged out.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }

  return (
    <motion.header
      animate={{ backgroundColor: scrolled ? 'rgba(5,5,16,0.78)' : 'rgba(5,5,16,0.12)' }}
      className={`fixed inset-x-0 top-0 z-50 border-b ${scrolled ? 'border-white/10 backdrop-blur-2xl' : 'border-transparent'}`}
    >
      <nav className="section-shell flex h-20 items-center justify-between gap-4">
        <Link to="/" className="shrink-0 bg-aura-gradient bg-clip-text font-orbitron text-xl font-extrabold text-transparent">
          AuraFlow
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className="relative rounded-md px-3 py-2 text-sm text-aura-muted transition hover:text-white">
              {({ isActive }) => (
                <>
                  {label}
                  {isActive ? <motion.span layoutId="active-nav" className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-aura-gradient" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <Tooltip text={user ? 'Open a private AuraFlow request' : 'Create a private AuraFlow client account'}>
            <ButtonLink to={user ? '/dashboard/requests/new' : '/register'}>{user ? 'New Request' : 'Client Portal'}</ButtonLink>
          </Tooltip>
          {user ? (
            <details className="group relative">
              <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border border-white/15 bg-white/10 font-bold text-white">
                <UserAvatar
                  className="h-full w-full rounded-lg"
                  name={profile?.name ?? user.displayName}
                  src={profile?.avatarUrl ?? user.photoURL}
                />
              </summary>
              <div className="absolute right-0 top-14 grid w-52 gap-1 rounded-lg border border-white/10 bg-aura-card p-2 shadow-2xl">
                <Link className="rounded-md px-3 py-2 text-sm text-white hover:bg-white/10" to="/dashboard">
                  Dashboard
                </Link>
                <button onClick={logoutNow} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </details>
          ) : (
            <ButtonLink to="/login" variant="secondary">
              <UserRound className="h-4 w-4" />
              Login
            </ButtonLink>
          )}
        </div>

        <button onClick={() => setOpen((current) => !current)} className="rounded-md border border-white/15 p-2 text-white xl:hidden" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="fixed inset-x-0 top-20 h-[calc(100svh-5rem)] overflow-auto border-t border-white/10 bg-aura-dark/95 p-4 backdrop-blur-2xl xl:hidden"
          >
            <motion.div variants={{ visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible" className="grid gap-2">
              {links.map(([label, to]) => (
                <motion.div key={to} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <NavLink onClick={() => setOpen(false)} to={to} className="block rounded-lg border border-white/10 bg-white/[0.06] p-4 text-lg text-white">
                    {label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <ButtonLink onClick={() => setOpen(false)} to={user ? '/dashboard/requests/new' : '/register'}>
                  {user ? 'New Request' : 'Client Portal'}
                </ButtonLink>
                <ButtonLink onClick={() => setOpen(false)} to={user ? '/dashboard' : '/login'} variant="secondary">
                  {user ? 'Dashboard' : 'Login'}
                </ButtonLink>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
