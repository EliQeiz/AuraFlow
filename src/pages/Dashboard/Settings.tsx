import { Camera, LogOut, MonitorCog, MoonStar, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { changePassword, removeAccount, uploadAvatar } from '../../lib/auth'
import { patchUserProfile } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { ThemePreference } from '../../types'

export default function Settings() {
  const { admin, logout, profile, refreshProfile, user } = useAuth()
  const { resolvedTheme, setTheme, theme } = useTheme()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const creatorHint = admin || user?.email?.toLowerCase() === 'elishaafari0@gmail.com'

  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) setTheme(profile.theme)
  }, [profile?.theme, setTheme, theme])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    const values = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await patchUserProfile(user.uid, {
        name: String(values.get('name') ?? ''),
        phone: String(values.get('phone') ?? ''),
        notifications: values.has('notifications'),
      })
      await refreshProfile()
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const addAvatar = async (file?: File) => {
    if (!file || !user) return
    setLoading(true)
    try {
      const avatarUrl = await uploadAvatar(user, file)
      await patchUserProfile(user.uid, { avatarUrl })
      await refreshProfile()
      toast.success('Avatar uploaded.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const updateSecret = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      await changePassword(user, password)
      setPassword('')
      toast.success('Password changed.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const deleteNow = async () => {
    if (!user) return
    setLoading(true)
    try {
      await removeAccount(user)
      toast.success('Account deleted.')
      navigate('/')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const changeTheme = async (nextTheme: ThemePreference) => {
    setTheme(nextTheme)
    if (!user) return
    try {
      await patchUserProfile(user.uid, { theme: nextTheme })
      await refreshProfile()
    } catch (error) {
      toast.error(asErrorMessage(error))
    }
  }

  const logoutNow = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h1 className="text-3xl font-extrabold">Settings</h1>
        <form key={`${profile?.name}-${profile?.phone}-${profile?.notifications}`} onSubmit={saveProfile} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm text-aura-muted">
            Name
            <Input name="name" defaultValue={profile?.name ?? user?.displayName ?? ''} />
          </label>
          <label className="grid gap-2 text-sm text-aura-muted">
            Phone
            <Input name="phone" defaultValue={profile?.phone ?? ''} />
          </label>
          <label className="flex items-center gap-2 text-sm text-aura-muted">
            <input name="notifications" type="checkbox" defaultChecked={profile?.notifications ?? true} className="accent-cyan-300" />
            Project notifications
          </label>
          <Button type="submit" loading={loading}>Save Profile</Button>
        </form>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-cyan-100">
          <Camera className="h-4 w-4" />
          Upload Avatar
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => void addAvatar(event.target.files?.[0])} />
        </label>
      </Card>

      <div className="grid gap-4">
        <Card className="p-5">
          <h2 className="text-2xl font-bold">Appearance</h2>
          <p className="mt-2 text-aura-muted">Current theme: {resolvedTheme}.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <ThemeButton active={theme === 'dark'} Icon={MoonStar} label="Dark" onClick={() => void changeTheme('dark')} />
            <ThemeButton active={theme === 'light'} Icon={Sun} label="Light" onClick={() => void changeTheme('light')} />
            <ThemeButton active={theme === 'system'} Icon={MonitorCog} label="Adaptive" onClick={() => void changeTheme('system')} />
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => void logoutNow()}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </Card>
        {creatorHint ? (
          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-5 w-5 text-cyan-100" /> Creator Access</h2>
            <p className="mt-2 leading-7 text-aura-muted">
              {admin ? 'This signed-in account already has the admin claim.' : 'This account needs the Firebase admin claim before the admin console appears in navigation.'}
            </p>
            <label className="mt-4 grid gap-2 text-sm text-aura-muted">
              Current Firebase UID
              <Input readOnly value={user?.uid ?? ''} />
            </label>
            <p className="mt-3 rounded-md border border-white/10 bg-black/20 p-3 font-mono text-xs text-cyan-100">npm run grant-admin -- {user?.uid ?? '<uid>'}</p>
            <ButtonLink to="/dashboard/admin" variant={admin ? 'primary' : 'secondary'} className="mt-4 w-full">Open Admin Console</ButtonLink>
          </Card>
        ) : null}
        <Card className="p-5">
          <h2 className="text-2xl font-bold">Change Password</h2>
          <form onSubmit={updateSecret} className="mt-4 grid gap-3">
            <Input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
            <Button type="submit" loading={loading}>Update Password</Button>
          </form>
        </Card>
        <Card className="border-rose-300/20 p-5">
          <h2 className="text-2xl font-bold">Delete Account</h2>
          <p className="mt-2 leading-7 text-aura-muted">Delete the authenticated account after confirming the action.</p>
          <Button variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </Card>
      </div>

      <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete account" description="This action cannot be undone." className="max-w-md">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={deleteNow}>Confirm Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

function ThemeButton({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean
  Icon: typeof MoonStar
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant={active ? 'primary' : 'secondary'} className="min-w-0 flex-col gap-1 px-2" onClick={onClick}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
