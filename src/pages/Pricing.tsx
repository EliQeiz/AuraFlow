import { Check } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '../components/ui/Button'
import { SEOHead } from '../components/shared/SEOHead'
import { pricingTiers, hostedPlans } from '../data/pricing'
import { pricingFaq } from '../data/faq'

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <main className="section-shell">
      <SEOHead
        title="Pricing"
        description="Discuss a hosted or custom delivery plan with AuraFlow."
      />
      <header className="public-page-heading">
        <span className="eyebrow">Simple starting points</span>
        <h1>A plan for your next chapter.</h1>
        <p>
          Choose a starting point. We will confirm your features, delivery
          schedule, and final quote before work begins.
        </p>
        <div className="studio-choice w-fit mt-7">
          <button aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button aria-pressed={yearly} onClick={() => setYearly(true)}>
            Yearly · save 20%
          </button>
        </div>
      </header>
      <div className="pricing-grid">
        {pricingTiers.map((plan) => (
          <article className="pricing-plan" key={plan.name}>
            <h2>{plan.name}</h2>
            <p>{plan.audience}</p>
            <strong>
              {plan.monthly === null
                ? "Let's talk"
                : `$${Math.round(plan.monthly * (yearly ? 0.8 : 1))}`}
              {plan.monthly !== null && <small> / month</small>}
            </strong>
            <small className="mt-3">
              {plan.monthly === null
                ? 'A quote for your requirements'
                : yearly
                  ? `USD ${Math.round(plan.monthly * 0.8 * 12).toLocaleString()} billed yearly`
                  : 'USD · subject to agreed scope'}
            </small>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check />
                  {feature}
                </li>
              ))}
            </ul>
            <ButtonLink
              variant={plan.name === 'Growth' ? 'primary' : 'secondary'}
              to={`/dashboard/requests/new?budget=${plan.monthly || 2500}&plan=${plan.name}`}
            >
              Discuss {plan.name.toLowerCase()}
            </ButtonLink>
          </article>
        ))}
      </div>
      <section className="py-16">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Managed by AuraFlow</span>
            <h2>Hosted systems, lower overhead.</h2>
            <p>
              We can scope a shared hosting plan for your business.
              Provisioning, domain choice, and operational modules are confirmed
              during discovery.
            </p>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Starting estimate</th>
                <th>For</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {hostedPlans.map((plan) => (
                <tr key={plan.name}>
                  <td>{plan.name}</td>
                  <td>{plan.price}</td>
                  <td>{plan.bestFor}</td>
                  <td>
                    <ButtonLink
                      variant="ghost"
                      to="/dashboard/requests/new?mode=managed-hosted"
                    >
                      Discuss plan
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="public-faq">
        <h2>A few useful answers.</h2>
        <div>
          {pricingFaq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
