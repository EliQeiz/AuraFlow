import { useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { submitContact } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

export function BookingForm() {
  const [loading, setLoading] = useState(false)

  const book = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await submitContact({
        name: String(data.get('name')),
        email: String(data.get('email')),
        service: 'Schedule a call',
        budget: 'To discuss',
        message: String(data.get('notes')),
      })
      toast.success('Call request sent.')
      event.currentTarget.reset()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={book} className="grid gap-3">
      <Input required name="name" placeholder="Name" />
      <Input required name="email" type="email" placeholder="Email" />
      <Textarea required name="notes" minLength={20} placeholder="Best time and project notes" />
      <Button type="submit" loading={loading}>
        Request Call
      </Button>
    </form>
  )
}
