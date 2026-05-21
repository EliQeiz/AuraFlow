import { motion } from 'framer-motion'
import { useState, type FormEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageWrapper } from '../../components/shared/PageWrapper'
import { SEOHead } from '../../components/shared/SEOHead'
import { useAuth } from '../../context/AuthContext'
import { loginWithGoogle, registerWithEmail } from '../../lib/auth'
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
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <PageWrapper>
      <SEOHead title="Register" description="Create an AuraFlow client dashboard account." />
      <section className="section-shell grid min-h-[calc(100svh-5rem)] place-items-center py-16">
        <motion.form initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="glass grid w-full max-w-lg gap-4 rounded-lg p-6 sm:p-8">
          <h1 className="text-4xl font-extrabold">Register</h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input required value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></Field>
            <Field label="Email"><Input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></Field>
            <Field label="Password"><Input required minLength={6} type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" /></Field>
            <Field label="Confirm Password"><Input required minLength={6} type="password" value={form.confirm} onChange={(event) => update('confirm', event.target.value)} autoComplete="new-password" /></Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-aura-muted">
            <input checked={form.terms} onChange={(event) => update('terms', event.target.checked)} type="checkbox" className="mt-1 accent-cyan-300" />
            I agree to the terms of service.
          </label>
          <div className="grid gap-2">
            <Button type="submit" loading={loading}>Create Account</Button>
            <Button type="button" variant="secondary" loading={loading} onClick={google}>Sign Up with Google</Button>
          </div>
          <p className="text-center text-sm text-aura-muted">
            Have an account? <Link to="/login" className="font-bold text-cyan-100">Login</Link>
          </p>
        </motion.form>
      </section>
    </PageWrapper>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm text-aura-muted">{label}{children}</label>
}
