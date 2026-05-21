import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageWrapper } from '../../components/shared/PageWrapper'
import { SEOHead } from '../../components/shared/SEOHead'
import { useAuth } from '../../context/AuthContext'
import { loginWithEmail, loginWithGoogle } from '../../lib/auth'
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
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <PageWrapper>
      <SEOHead title="Login" description="Sign in to the AuraFlow client dashboard." />
      <section className="section-shell grid min-h-[calc(100svh-5rem)] place-items-center py-16">
        <motion.form
          onSubmit={submit}
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="glass grid w-full max-w-md gap-4 rounded-lg p-6 sm:p-8"
        >
          <motion.div variants={fieldMotion}>
            <h1 className="text-4xl font-extrabold">Login</h1>
            <p className="mt-2 text-aura-muted">Open projects, templates, and account settings.</p>
          </motion.div>
          <motion.label variants={fieldMotion} className="grid gap-2 text-sm text-aura-muted">
            Email
            <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </motion.label>
          <motion.label variants={fieldMotion} className="grid gap-2 text-sm text-aura-muted">
            Password
            <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </motion.label>
          <motion.div variants={fieldMotion} className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-bold text-cyan-100">
              Forgot password?
            </Link>
          </motion.div>
          <motion.div variants={fieldMotion} className="grid gap-2">
            <Button type="submit" loading={loading}>
              Login
            </Button>
            <Button type="button" variant="secondary" loading={loading} onClick={google}>
              Continue with Google
            </Button>
          </motion.div>
          <motion.p variants={fieldMotion} className="text-center text-sm text-aura-muted">
            No account? <Link className="font-bold text-cyan-100" to="/register">Register</Link>
          </motion.p>
        </motion.form>
      </section>
    </PageWrapper>
  )
}

const fieldMotion = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
