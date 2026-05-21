import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { services } from '../../data/services'
import { submitQuote } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { QuotePayload } from '../../types'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'

const steps = ['Project Type', 'Details', 'Budget & Timeline', 'Contact', 'Review']
const featureOptions = ['Authentication', 'Payments', 'Dashboard', 'Booking', 'AI', 'Mobile notifications']

export function QuoteForm() {
  const [searchParams] = useSearchParams()
  const selectedService = services.find((service) => service.id === searchParams.get('service'))
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState<QuotePayload>({
    projectType: selectedService?.title ?? '',
    details: '',
    audience: '',
    features: [],
    budget: 5000,
    urgency: 'Standard',
    name: '',
    email: '',
    phone: '',
    contactMethod: 'Email',
    templateSlug: searchParams.get('template') ?? undefined,
  })

  const progress = ((step + 1) / steps.length) * 100
  const currentService = useMemo(() => services.find((service) => service.title === form.projectType), [form.projectType])

  const update = <K extends keyof QuotePayload>(key: K, value: QuotePayload[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const next = () => {
    if (step === 0 && !form.projectType) return toast.error('Choose a project type.')
    if (step === 1 && (form.details.length < 20 || !form.audience)) return toast.error('Add project details and audience.')
    if (step === 3 && (!form.name || !form.email.includes('@'))) return toast.error('Add your contact details.')
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const toggleFeature = (feature: string) =>
    update(
      'features',
      form.features.includes(feature) ? form.features.filter((item) => item !== feature) : [...form.features, feature],
    )

  const submit = async () => {
    setLoading(true)
    try {
      await submitQuote(form)
      setSent(true)
      toast.success('Quote request sent.')
      void confetti({ particleCount: 140, spread: 90, colors: ['#6C63FF', '#00D4FF', '#FFFFFF'] })
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <Check className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-400/15 p-2 text-emerald-200" />
        <h2 className="text-3xl font-bold">Quote request received</h2>
        <p className="mx-auto mt-3 max-w-xl text-aura-muted">AuraFlow has your project shape and will follow up through {form.contactMethod.toLowerCase()}.</p>
      </div>
    )
  }

  return (
    <section className="glass rounded-lg p-4 sm:p-7">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-aura-muted">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <strong className="font-syne text-white">{steps[step]}</strong>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-aura-gradient" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          className="min-h-[24rem]"
        >
          {step === 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => update('projectType', service.title)}
                  className={`rounded-lg border p-4 text-left transition ${
                    form.projectType === service.title ? 'border-cyan-200 bg-cyan-300/15' : 'border-white/10 bg-black/20 hover:border-white/30'
                  }`}
                >
                  <span className="font-syne text-lg font-bold text-white">{service.shortTitle}</span>
                  <span className="mt-1 block text-sm text-aura-muted">{service.timeline}</span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-aura-muted">
                Project specifics
                <Textarea value={form.details} onChange={(event) => update('details', event.target.value)} placeholder="Pages, platforms, data, integrations, and the problem to solve" />
              </label>
              <label className="grid gap-2 text-sm text-aura-muted">
                Target audience
                <Input value={form.audience} onChange={(event) => update('audience', event.target.value)} placeholder="Clients, patients, staff, shoppers..." />
              </label>
              <fieldset className="grid gap-2">
                <legend className="text-sm text-aura-muted">Features needed</legend>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        form.features.includes(feature) ? 'border-aura-violet bg-aura-violet/20 text-white' : 'border-white/15 text-aura-muted'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5">
              <label className="grid gap-3 text-sm text-aura-muted">
                Budget target: <strong className="font-orbitron text-xl text-white">${form.budget.toLocaleString()}</strong>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={form.budget}
                  onChange={(event) => update('budget', Number(event.target.value))}
                  className="accent-cyan-300"
                />
              </label>
              <label className="grid gap-2 text-sm text-aura-muted">
                Timeline urgency
                <Select value={form.urgency} onChange={(event) => update('urgency', event.target.value)}>
                  <option>Flexible</option>
                  <option>Standard</option>
                  <option>Launch this month</option>
                  <option>Urgent</option>
                </Select>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-aura-muted">
                Name
                <Input value={form.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" />
              </label>
              <label className="grid gap-2 text-sm text-aura-muted">
                Email
                <Input value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" type="email" />
              </label>
              <label className="grid gap-2 text-sm text-aura-muted">
                Phone
                <Input value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" />
              </label>
              <label className="grid gap-2 text-sm text-aura-muted">
                Preferred contact
                <Select value={form.contactMethod} onChange={(event) => update('contactMethod', event.target.value)}>
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </Select>
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <dl className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-5 text-sm sm:grid-cols-2">
              <Review label="Project" value={currentService?.title ?? form.projectType} />
              <Review label="Budget" value={`$${form.budget.toLocaleString()}`} />
              <Review label="Timeline" value={form.urgency} />
              <Review label="Audience" value={form.audience} />
              <Review label="Features" value={form.features.join(', ') || 'Discovery to decide'} />
              <Review label="Contact" value={`${form.name} via ${form.contactMethod}`} />
              {form.templateSlug ? <Review label="Template" value={form.templateSlug} /> : null}
              <div className="sm:col-span-2">
                <Review label="Details" value={form.details} />
              </div>
            </dl>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        <Button variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step === steps.length - 1 ? (
          <Button onClick={submit} loading={loading}>
            Submit Quote
          </Button>
        ) : (
          <Button onClick={next}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-aura-muted">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  )
}
