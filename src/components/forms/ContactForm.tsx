import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { services } from '../../data/services'
import { useContactForm } from '../../hooks/useContactForm'
import { submitContact } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'

export function ContactForm() {
  const form = useContactForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true)
    try {
      await submitContact(values)
      toast.success('Message sent. AuraFlow will reply soon.')
      form.reset()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  })

  const fieldClass = 'grid gap-1.5 text-sm text-aura-muted'
  const errors = form.formState.errors

  return (
    <motion.form
      onSubmit={onSubmit}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className="glass grid gap-4 rounded-lg p-5 sm:p-7"
    >
      {[
        <label key="name" className={fieldClass}>
          Name
          <Input placeholder="Your name" autoComplete="name" {...form.register('name')} />
          {errors.name ? <span className="text-rose-300">{errors.name.message}</span> : null}
        </label>,
        <label key="email" className={fieldClass}>
          Email
          <Input type="email" placeholder="you@company.com" autoComplete="email" {...form.register('email')} />
          {errors.email ? <span className="text-rose-300">{errors.email.message}</span> : null}
        </label>,
        <label key="phone" className={fieldClass}>
          Phone
          <Input placeholder="Optional phone" autoComplete="tel" {...form.register('phone')} />
        </label>,
        <label key="service" className={fieldClass}>
          Service interested in
          <Select {...form.register('service')}>
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.title}>
                {service.title}
              </option>
            ))}
          </Select>
          {errors.service ? <span className="text-rose-300">{errors.service.message}</span> : null}
        </label>,
        <label key="budget" className={fieldClass}>
          Budget range
          <Select {...form.register('budget')}>
            <option value="">Select budget</option>
            {['<$500', '$500-1K', '$1K-5K', '$5K-20K', '$20K+'].map((budget) => (
              <option key={budget}>{budget}</option>
            ))}
          </Select>
          {errors.budget ? <span className="text-rose-300">{errors.budget.message}</span> : null}
        </label>,
        <label key="message" className={fieldClass}>
          Message
          <Textarea placeholder="Goals, audience, pages, data, deadline..." {...form.register('message')} />
          {errors.message ? <span className="text-rose-300">{errors.message.message}</span> : null}
        </label>,
      ].map((field) => (
        <motion.div key={field.key} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
          {field}
        </motion.div>
      ))}
      <Button type="submit" loading={loading} className="w-full sm:w-fit">
        Send Message
      </Button>
    </motion.form>
  )
}
