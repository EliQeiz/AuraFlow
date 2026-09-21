import {
  Accessibility,
  Camera,
  Download,
  Bell,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { reload, sendEmailVerification } from 'firebase/auth'
import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Modal } from '../../components/ui/Modal'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useProjects } from '../../hooks/useFirebase'
import { changePassword, uploadAvatar } from '../../lib/auth'
import { patchUserProfile } from '../../lib/firestore'
import {
  startSupportConversation,
  sendSupportMessage,
} from '../../lib/conversations'
import { asErrorMessage } from '../../lib/utils'
import { rasterTypes, validateMedia } from '../../lib/media'
import { passwordSchema } from '../../domain/auth'
import type { ThemePreference } from '../../types'

export default function Settings() {
  const { user, profile, admin, logout, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const projects = useProjects(user?.uid)
  const navigate = useNavigate()
  const [pending, setPending] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => window.localStorage.getItem('auraflow-reduce-motion') === 'true')
  const [compactWorkspace, setCompactWorkspace] = useState(() => window.localStorage.getItem('auraflow-compact-workspace') === 'true')
  const [emailNotifications, setEmailNotifications] = useState(() => window.localStorage.getItem('auraflow-email-notifications') !== 'false')
  const passwordAccount = user?.providerData.some(
    (provider) => provider.providerId === 'password',
  )
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduceMotion)
    document.documentElement.dataset.compactWorkspace = String(compactWorkspace)
  }, [compactWorkspace, reduceMotion])
  async function act(name: string, action: () => Promise<void>) {
    setPending(name)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending('')
    }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    void act('profile', async () => {
      await patchUserProfile(user!.uid, {
        name: String(values.get('name')).trim(),
        phone: String(values.get('phone')).trim(),
      })
      await refreshProfile()
      toast.success('Profile saved.')
    })
  }
  function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    void act('password', async () => {
      const next = passwordSchema.parse(values.get('password'))
      if (next !== values.get('confirm'))
        throw new Error('New passwords do not match.')
      await changePassword(user!, next, String(values.get('current')))
      form.reset()
      toast.success('Password updated.')
    })
  }
  async function appearance(value: ThemePreference) {
    const previous = theme
    setTheme(value)
    await act('theme', async () => {
      try {
        await patchUserProfile(user!.uid, { theme: value })
        await refreshProfile()
      } catch (err) {
        setTheme(previous)
        throw err
      }
    })
  }
  function preference(key: string, value: boolean, setter: (next: boolean) => void) {
    setter(value)
    window.localStorage.setItem(key, String(value))
    toast.success('Workspace preference updated.')
  }
  function exportData() {
    const content = JSON.stringify(
      { profile, projects: projects.data },
      null,
      2,
    )
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'auraflow-project-data.json'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="settings-layout">
      <div className="workspace-page-header">
        <div>
          <h1>Settings</h1>
          <p>Make this workspace yours.</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="inline-alert error mb-6">
          {error}
        </p>
      )}
      <section className="settings-section">
        <div>
          <h2>Profile</h2>
          <p>Your name and contact details.</p>
        </div>
        <div>
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar
              className="w-14 h-14 rounded-full"
              src={profile?.avatarUrl || user?.photoURL}
              name={profile?.name || user?.displayName}
            />
            <label className="af-button af-button--secondary cursor-pointer">
              <Camera size={14} />
              {pending === 'avatar' ? 'Uploading...' : 'Change photo'}
              <input
                className="sr-only"
                type="file"
                accept={rasterTypes.join(',')}
                disabled={Boolean(pending)}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file)
                    void act('avatar', async () => {
                      validateMedia(file, true)
                      const avatarUrl = await uploadAvatar(user!, file)
                      await patchUserProfile(user!.uid, { avatarUrl })
                      await refreshProfile()
                      toast.success('Photo updated.')
                    })
                }}
              />
            </label>
          </div>
          <form
            key={`${profile?.name}-${profile?.phone}`}
            className="settings-form"
            onSubmit={save}
          >
            <Field label="Full name">
              <Input
                name="name"
                defaultValue={profile?.name || user?.displayName || ''}
                minLength={2}
                maxLength={120}
                required
                autoComplete="name"
              />
            </Field>
            <Field label="Email address">
              <Input value={user?.email || ''} readOnly />
            </Field>
            <Field label="Phone number">
              <Input
                name="phone"
                defaultValue={profile?.phone || ''}
                maxLength={40}
                autoComplete="tel"
                type="tel"
              />
            </Field>
            <Button
              type="submit"
              className="justify-self-start"
              loading={pending === 'profile'}
              disabled={Boolean(pending)}
            >
              Save profile
            </Button>
          </form>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Workspace behavior</h2>
          <p>Control motion, density, and update preferences for this device.</p>
        </div>
        <div className="settings-preferences">
          <button
            type="button"
            className="settings-preference"
            aria-pressed={reduceMotion}
            onClick={() => preference('auraflow-reduce-motion', !reduceMotion, setReduceMotion)}
          >
            <Accessibility size={18} />
            <span><strong>Reduce motion</strong><small>Use calmer transitions in the studio and workspace.</small></span>
            <i aria-hidden="true" />
          </button>
          <button
            type="button"
            className="settings-preference"
            aria-pressed={compactWorkspace}
            onClick={() => preference('auraflow-compact-workspace', !compactWorkspace, setCompactWorkspace)}
          >
            <Monitor size={18} />
            <span><strong>Compact workspace</strong><small>Fit more project information into each view.</small></span>
            <i aria-hidden="true" />
          </button>
          <button
            type="button"
            className="settings-preference"
            aria-pressed={emailNotifications}
            onClick={() => preference('auraflow-email-notifications', !emailNotifications, setEmailNotifications)}
          >
            <Bell size={18} />
            <span><strong>Email updates</strong><small>Receive important request and project updates.</small></span>
            <i aria-hidden="true" />
          </button>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Appearance</h2>
          <p>Choose a theme, or follow your device settings.</p>
        </div>
        <div className="theme-options">
          {(
            [
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
              { value: 'system', label: 'System', Icon: Monitor },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              className="theme-option"
              key={value}
              aria-pressed={theme === value}
              disabled={Boolean(pending)}
              onClick={() => void appearance(value)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Account security</h2>
          <p>Manage your sign-in method and email verification.</p>
        </div>
        <div className="settings-form">
          <div className="inline-alert">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              {user?.emailVerified ? 'Email verified' : 'Email not verified'}
            </div>
          </div>
          {!user?.emailVerified && (
            <div className="page-actions">
              <Button
                variant="secondary"
                disabled={Boolean(pending) || verificationSent}
                onClick={() =>
                  void act('verify', async () => {
                    await sendEmailVerification(user!)
                    setVerificationSent(true)
                    toast.success('Verification email sent.')
                  })
                }
              >
                {verificationSent ? 'Email sent' : 'Send verification email'}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  void act('check', async () => {
                    await reload(user!)
                    await refreshProfile()
                    toast.success(
                      user!.emailVerified
                        ? 'Email verified.'
                        : 'Not verified yet. Check the link in your email.',
                    )
                  })
                }
              >
                Check verification
              </Button>
            </div>
          )}
          {passwordAccount ? (
            <form className="settings-form" onSubmit={updatePassword}>
              <Field label="Current password">
                <PasswordInput
                  name="current"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password" hint="At least 10 characters.">
                <PasswordInput
                  name="password"
                  required
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <PasswordInput
                  name="confirm"
                  required
                  maxLength={128}
                  autoComplete="new-password"
                />
              </Field>
              <Button
                type="submit"
                variant="secondary"
                loading={pending === 'password'}
                disabled={Boolean(pending)}
                className="justify-self-start"
              >
                Update password
              </Button>
            </form>
          ) : (
            <p>
              You sign in with Google. Manage your password in your Google
              account.
            </p>
          )}
        </div>
      </section>
      {admin && (
        <section className="settings-section">
          <div>
            <h2>Administration</h2>
            <p>Your account has AuraFlow administrator access.</p>
          </div>
          <ButtonLink
            to="/dashboard/admin"
            variant="secondary"
            className="justify-self-start self-start"
          >
            Open admin console
          </ButtonLink>
        </section>
      )}
      <section className="settings-section">
        <div>
          <h2>Your data</h2>
          <p>
            Download your profile and the projects currently loaded in your
            workspace.
          </p>
        </div>
        <div className="page-actions items-start">
          <Button
            variant="secondary"
            disabled={projects.isPending || Boolean(projects.error)}
            onClick={exportData}
          >
            <Download />
            Export project data
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Request account deletion
          </Button>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Sign out</h2>
          <p>End your session on this device.</p>
        </div>
        <Button
          variant="secondary"
          disabled={Boolean(pending)}
          className="justify-self-start self-start"
          onClick={() =>
            void act('logout', async () => {
              await logout()
              navigate('/login', { replace: true })
            })
          }
        >
          <LogOut />
          Sign out
        </Button>
      </section>
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Request account deletion"
        description="Our team will confirm the request with you and review active projects and retained business records before deleting your account."
        className="max-w-lg"
      >
        <div className="settings-form">
          <Field label="Type DELETE to confirm">
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>
          <Button
            variant="danger"
            loading={pending === 'delete'}
            disabled={confirmation !== 'DELETE' || Boolean(pending)}
            onClick={() =>
              void act('delete', async () => {
                const id = await startSupportConversation()
                await sendSupportMessage(
                  id,
                  'I request deletion of my AuraFlow account and personal data. Please confirm the next steps and any records that must be retained.',
                  'client',
                )
                setDeleteOpen(false)
                toast.success(
                  'Deletion request sent. Our team will contact you in Messages.',
                )
              })
            }
          >
            Send deletion request
          </Button>
        </div>
      </Modal>
    </div>
  )
}
