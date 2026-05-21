import { useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { subscribeEmail } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.includes('@')) {
      toast.error('Add a valid email address.')
      return
    }
    setLoading(true)
    try {
      await subscribeEmail(email)
      toast.success('You are on the AuraFlow newsletter list.')
      setEmail('')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className={`flex w-full gap-2 ${compact ? 'max-w-sm' : 'mx-auto max-w-xl flex-col sm:flex-row'}`}>
      <label className="sr-only" htmlFor={compact ? 'footer-newsletter' : 'newsletter'}>
        Email
      </label>
      <Input
        id={compact ? 'footer-newsletter' : 'newsletter'}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        autoComplete="email"
      />
      <Button type="submit" loading={loading} className="shrink-0">
        Subscribe
      </Button>
    </form>
  )
}
