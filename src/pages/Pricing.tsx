import { Check, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { pricingFaq } from '../data/faq'
import { hostedPlans, pricingTiers, templatePricing } from '../data/pricing'

export default function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <PageWrapper>
      <SEOHead title="Pricing" description="AuraFlow pricing for websites, product builds, support, and template launch tiers." />
      <section className="section-shell py-16 text-center">
        <Badge>Pricing</Badge>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold sm:text-6xl">Choose the delivery lane. Keep the build honest.</h1>
        <div className="mx-auto mt-7 inline-flex rounded-lg border border-white/10 bg-white/[0.07] p-1">
          <button onClick={() => setYearly(false)} className={`rounded-md px-4 py-2 text-sm font-bold ${!yearly ? 'bg-aura-gradient text-white' : 'text-aura-muted'}`}>
            Monthly
          </button>
          <button onClick={() => setYearly(true)} className={`rounded-md px-4 py-2 text-sm font-bold ${yearly ? 'bg-aura-gradient text-white' : 'text-aura-muted'}`}>
            Yearly - save 20%
          </button>
        </div>
      </section>

      <section className="section-shell grid gap-4 pb-20 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} tilt className={`relative p-6 ${tier.featured ? 'border-cyan-200/55 shadow-cyan' : ''}`}>
            {tier.featured ? <Badge className="absolute right-5 top-5">Most Popular</Badge> : null}
            <h2 className="text-3xl font-bold">{tier.name}</h2>
            <p className="mt-2 min-h-12 text-aura-muted">{tier.audience}</p>
            <strong className="mt-6 block font-orbitron text-4xl text-white">
              {tier.monthly === null ? 'Custom' : `$${Math.round(tier.monthly * (yearly ? 0.8 : 1))}`}
              {tier.monthly !== null ? <span className="font-dmSans text-base text-aura-muted">/mo</span> : null}
            </strong>
            <ul className="mt-6 grid gap-3 text-aura-muted">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-100" />
                  {feature}
                </li>
              ))}
            </ul>
            <ButtonLink to="/register" className="mt-7 w-full">
              {tier.monthly === null ? 'Start Enterprise Scope' : `Choose ${tier.name}`}
            </ButtonLink>
          </Card>
        ))}
      </section>

      <section className="border-y border-white/10 bg-aura-surface/60 py-20">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <Badge>Managed Hosting</Badge>
              <h2 className="mt-4 text-3xl font-extrabold">Low-cost hosted systems</h2>
              <p className="mt-3 max-w-3xl text-aura-muted">Start on an AuraFlow-managed link with working admin tools, then upgrade to deeper custom ownership when the business is ready.</p>
            </div>
            <ButtonLink to="/solutions" variant="secondary" className="w-fit">Explore Systems</ButtonLink>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {hostedPlans.map((plan) => (
              <Card key={plan.name} className="p-5">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <strong className="mt-4 block font-orbitron text-3xl text-cyan-100">{plan.price}</strong>
                <p className="mt-3 text-sm leading-6 text-aura-muted">{plan.bestFor}</p>
                <p className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-aura-muted">{plan.includes}</p>
                <ButtonLink to="/register" className="mt-5 w-full">Start In App</ButtonLink>
              </Card>
            ))}
          </div>

          <h2 className="mt-14 text-3xl font-extrabold">Template Pricing</h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full border-collapse text-left">
              <thead className="bg-white/[0.07] text-sm text-aura-muted">
                <tr>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Includes</th>
                </tr>
              </thead>
              <tbody>
                {templatePricing.map((row) => (
                  <tr key={row.tier} className="border-t border-white/10 text-sm">
                    <td className="p-4 font-bold text-white">{row.tier}</td>
                    <td className="p-4 font-orbitron text-cyan-100">{row.price}</td>
                    <td className="p-4 text-aura-muted">{row.includes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 flex flex-col gap-3 rounded-lg border border-emerald-200/20 bg-emerald-300/10 p-5 sm:flex-row sm:items-center">
            <ShieldCheck className="h-10 w-10 text-emerald-100" />
            <div>
              <strong className="block text-white">Milestone guarantee</strong>
              <span className="text-aura-muted">AuraFlow revises the agreed first milestone before moving ahead when it misses the brief.</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-shell grid gap-4 py-20 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <h2 className="text-3xl font-extrabold">Pricing FAQ</h2>
          <div className="mt-6 grid gap-3">
            {pricingFaq.map((item) => (
              <details key={item.question} className="glass rounded-lg p-5">
                <summary className="cursor-pointer list-none font-syne font-bold">{item.question}</summary>
                <p className="mt-3 leading-7 text-aura-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="glass flex flex-col justify-center rounded-lg p-7 text-xl leading-9 text-white">
          <strong className="text-2xl">Private scope first.</strong>
          <p className="mt-4 text-aura-muted">The account workspace collects the prototype, selected modules, assets, preview feedback, and chat history before AuraFlow commits to a build lane.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/solutions" variant="secondary">Hosted Systems</ButtonLink>
            <ButtonLink to="/register" className="w-fit">Create Client Account</ButtonLink>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
