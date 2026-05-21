import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageWrapper } from '../../components/shared/PageWrapper'
import { SEOHead } from '../../components/shared/SEOHead'
import { requestPasswordReset } from '../../lib/auth'
import { asErrorMessage } from '../../lib/utils'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email)
      toast.success('Reset email sent.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <SEOHead title="Forgot Password" description="Request an AuraFlow password reset email." />
      <section className="section-shell grid min-h-[calc(100svh-5rem)] place-items-center py-16">
        <form onSubmit={submit} className="glass grid w-full max-w-md gap-4 rounded-lg p-6">
          <h1 className="text-3xl font-extrabold">Reset password</h1>
          <label className="grid gap-2 text-sm text-aura-muted">
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <Button type="submit" loading={loading}>Send Reset Email</Button>
          <Link to="/login" className="text-sm font-bold text-cyan-100">Back to login</Link>
        </form>
      </section>
    </PageWrapper>
  )
}
