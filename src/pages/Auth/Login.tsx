import { useState, type FormEvent } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Field } from '../../components/ui/Field'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { SEOHead } from '../../components/shared/SEOHead'
import { useAuth } from '../../context/AuthContext'
import { loginWithEmail, loginWithGoogle } from '../../lib/auth'
import { firebaseConfigured } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'
import { authDestination } from '../../domain/auth'

export default function Login() {
  const { user, loading: resolving } = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState('')
  const destination = authDestination(location.state)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending('email')
    setError('')
    try {
      await loginWithEmail(
        String(form.get('email')),
        String(form.get('password')),
        form.has('remember'),
      )
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(null)
    }
  }
  async function google() {
    setPending('google')
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(null)
    }
  }
  if (user && !resolving) return <Navigate to={destination} replace />
  return (
    <>
      <SEOHead
        title="Sign in"
        description="Sign in to your AuraFlow workspace."
      />
      <AuthShell
        title="Welcome back to AuraFlow"
        footer="Your projects, conversations, and next big idea."
      >
        {!firebaseConfigured && (
          <p className="inline-alert error mb-5" role="alert">
            Account services are temporarily unavailable. Please contact
            support.
          </p>
        )}
        {error && (
          <p className="inline-alert error mb-5" role="alert">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          variant="secondary"
          onClick={google}
          loading={pending === 'google'}
          disabled={Boolean(pending) || !firebaseConfigured}
        >
          <FcGoogle size={18} /> Continue with Google
        </Button>
        <div className="auth-divider">or sign in with email</div>
        <form className="auth-form" onSubmit={submit}>
          <Field label="Email address">
            <Input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </Field>
          <div className="auth-options">
            <label>
              <input type="checkbox" name="remember" defaultChecked /> Keep me
              signed in
            </label>
            <Link className="auth-text-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            loading={pending === 'email'}
            disabled={Boolean(pending) || !firebaseConfigured}
          >
            Sign in
          </Button>
        </form>
        <p className="auth-switch">
          New to AuraFlow?{' '}
          <Link
            className="auth-text-link"
            to="/register"
            state={location.state}
          >
            Create an account
          </Link>
        </p>
      </AuthShell>
    </>
  )
}
