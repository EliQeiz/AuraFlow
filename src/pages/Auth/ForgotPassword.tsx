import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../../components/auth/AuthShell'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { requestPasswordReset } from '../../lib/auth'
import { asErrorMessage } from '../../lib/utils'
import { firebaseConfigured } from '../../lib/firebase'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email')).trim()
    setPending(true)
    setError('')
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      if ((err as { code?: string }).code === 'auth/user-not-found')
        setSent(true)
      else setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Reset your password'}
      footer={
        sent
          ? 'If that address has an account, a reset link is on its way. Check your spam folder too.'
          : 'Enter your account email and we will send a reset link.'
      }
    >
      {error && (
        <p role="alert" className="inline-alert error mb-5">
          {error}
        </p>
      )}
      {!sent && (
        <form className="auth-form" onSubmit={submit}>
          <Field label="Email address">
            <Input
              type="email"
              autoComplete="email"
              name="email"
              required
              maxLength={254}
            />
          </Field>
          <Button
            type="submit"
            loading={pending}
            disabled={!firebaseConfigured}
          >
            Send reset link
          </Button>
        </form>
      )}
      <p className="auth-switch">
        <Link className="auth-text-link" to="/login">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
