import { AlertCircle, KeyRound, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageWrapper } from '../../components/shared/PageWrapper'
import { SEOHead } from '../../components/shared/SEOHead'
import { useAuth } from '../../context/AuthContext'
import { loginWithGoogle, loginWithGoogleRedirect, registerWithEmail, shouldUseGoogleRedirect } from '../../lib/auth'
import { firebaseConfigured } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false })
  const [loading, setLoading] = useState(false)
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords must match.')
    if (!form.terms) return toast.error('Accept the terms to register.')
    setLoading(true)
    try {
      await registerWithEmail(form.name, form.email, form.password)
      toast.success('Account created.')
      navigate('/dashboard')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const google = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (error) {
      if (shouldUseGoogleRedirect(error)) {
        toast.success('Redirecting to Google sign-in.')
        await loginWithGoogleRedirect()
        return
      }
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <PageWrapper>
      <SEOHead title="Register" description="Create an AuraFlow client dashboard account." />
      <AuthShell eyebrow="Create Portal" title="Start your workspace" footer="Design a suite, upload references, track previews, and chat with AuraFlow after signing in.">
        {!firebaseConfigured ? <ConfigWarning /> : null}
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" icon={<UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />}>
              <Input className="pl-10" required value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email" icon={<Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />}>
              <Input className="pl-10" required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password" icon={<KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />}>
              <Input className="pl-10" required minLength={6} type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" icon={<KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />}>
              <Input className="pl-10" required minLength={6} type="password" value={form.confirm} onChange={(event) => update('confirm', event.target.value)} autoComplete="new-password" />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-aura-muted">
            <input checked={form.terms} onChange={(event) => update('terms', event.target.checked)} type="checkbox" className="mt-1 accent-cyan-300" />
            <span>I agree to use AuraFlow responsibly and to upload only files, images, and data I have permission to share.</span>
          </label>
          <div className="grid gap-3 pt-1">
            <Button type="submit" loading={loading} disabled={!firebaseConfigured} className="min-h-12 text-base">Create Account</Button>
            <Button type="button" variant="secondary" loading={loading} disabled={!firebaseConfigured} onClick={google} className="min-h-12 text-base">
              <FcGoogle className="h-5 w-5" />
              Sign Up with Google
            </Button>
          </div>
          <p className="text-center text-sm text-aura-muted">
            Have an account? <Link to="/login" className="font-bold text-cyan-100">Sign in</Link>
          </p>
        </form>
      </AuthShell>
    </PageWrapper>
  )
}

function Field({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-aura-muted">
      {label}
      <div className="relative">
        {icon}
        {children}
      </div>
    </label>
  )
}

function ConfigWarning() {
  return (
    <div className="mb-4 flex gap-3 rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm leading-6 text-rose-50">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      Firebase is not configured for this environment yet. Add the required `VITE_FIREBASE_*` values, rebuild, and redeploy.
    </div>
  )
}
