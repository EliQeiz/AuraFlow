import { AlertCircle, KeyRound, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageWrapper } from '../../components/shared/PageWrapper'
import { SEOHead } from '../../components/shared/SEOHead'
import { useAuth } from '../../context/AuthContext'
import { loginWithEmail, loginWithGoogle, loginWithGoogleRedirect, shouldUseGoogleRedirect } from '../../lib/auth'
import { firebaseConfigured } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Welcome back.')
      navigate(nextPath, { replace: true })
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
      navigate(nextPath, { replace: true })
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
      <SEOHead title="Login" description="Sign in to the AuraFlow client dashboard." />
      <AuthShell eyebrow="Client Portal" title="Welcome back" footer="Open your private requests, previews, files, chat, and suite builder workspace.">
        {!firebaseConfigured ? <ConfigWarning /> : null}
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-aura-muted">
            Email address
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />
              <Input className="pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-bold text-aura-muted">
            Password
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />
              <Input className="pl-10" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          </label>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-bold text-cyan-100">
              Forgot password?
            </Link>
          </div>
          <div className="grid gap-3 pt-1">
            <Button type="submit" loading={loading} disabled={!firebaseConfigured} className="min-h-12 text-base">
              Sign In
            </Button>
            <Button type="button" variant="secondary" loading={loading} disabled={!firebaseConfigured} onClick={google} className="min-h-12 text-base">
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </Button>
          </div>
          <p className="text-center text-sm text-aura-muted">
            New to AuraFlow? <Link className="font-bold text-cyan-100" to="/register">Create your account</Link>
          </p>
        </form>
      </AuthShell>
    </PageWrapper>
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
