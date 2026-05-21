import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Please add your name.'),
  email: z.string().email('Please add a valid email.'),
  phone: z.string().optional(),
  service: z.string().min(1, 'Choose a service.'),
  budget: z.string().min(1, 'Choose a budget.'),
  message: z.string().min(20, 'Tell us a little more about the project.'),
})

export type ContactValues = z.infer<typeof contactSchema>

export function useContactForm() {
  return useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: '',
      budget: '',
      message: '',
    },
  })
}
