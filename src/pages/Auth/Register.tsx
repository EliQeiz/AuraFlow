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
import { loginWithGoogle, registerWithEmail } from '../../lib/auth'
import { firebaseConfigured } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'
import { authDestination, registrationSchema } from '../../domain/auth'

export default function Register() {
  const { user, loading: resolving } = useAuth()
  const location = useLocation()
  const [pending, setPending] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [terms, setTerms] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = Object.fromEntries(new FormData(event.currentTarget))
    const result = registrationSchema.safeParse({ ...raw, terms })
    setErrors({})
    setError('')
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      )
      return
    }
    setPending('email')
    try {
      await registerWithEmail(
        result.data.name,
        result.data.email,
        result.data.password,
      )
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(null)
    }
  }
  async function google() {
    if (!terms) {
      setError('Please accept the terms below to continue with Google.')
      return
    }
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
  if (user && !resolving && !pending)
    return <Navigate to={authDestination(location.state)} replace />
  return (
    <>
      <SEOHead
        title="Create your account"
        description="Start your private AuraFlow workspace."
      />
      <AuthShell
        title="Create your AuraFlow account"
        footer="A workspace for the business you want to build."
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
        <div className="auth-divider">or create an account with email</div>
        <form className="auth-form" noValidate onSubmit={submit}>
          <Field label="Full name" error={errors.name}>
            <Input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email address" error={errors.email}>
            <Input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="you@company.com"
            />
          </Field>
          <Field
            label="Password"
            hint="At least 10 characters. A passphrase works well."
            error={errors.password}
          >
            <PasswordInput
              name="password"
              autoComplete="new-password"
              required
              maxLength={128}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <PasswordInput
              name="confirm"
              autoComplete="new-password"
              required
              maxLength={128}
            />
          </Field>
          <label className="check-label">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link className="auth-text-link" to="/terms" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link className="auth-text-link" to="/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="field-error" role="alert">
              {errors.terms}
            </p>
          )}
          <Button
            type="submit"
            loading={pending === 'email'}
            disabled={Boolean(pending) || !firebaseConfigured}
          >
            Create account
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <Link className="auth-text-link" to="/login" state={location.state}>
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  )
}
