import { ArrowRight, Check } from 'lucide-react'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import { services } from '../data/services'

export default function Services() {
  return (
    <main className="section-shell">
      <SEOHead
        title="Development Services"
        description="Websites, mobile apps, dashboards, design, integrations, and support from AuraFlow."
      />
      <header className="public-page-heading">
        <span className="eyebrow">Work with our team</span>
        <h1>From a website to your next product.</h1>
        <p>
          Design, development, and ongoing support, with a clear brief and a
          team you can talk to.
        </p>
      </header>
      <div className="service-list">
        {services.map((service, index) => (
          <section className="service-row" key={service.id}>
            <div>
              <span className="eyebrow">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <details className="mt-5">
                <summary className="text-xs cursor-pointer">
                  What's included
                </summary>
                <ul className="grid gap-3 mt-5">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-xs text-aura-muted"
                    >
                      <Check size={13} className="text-[var(--positive)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="text-xs mt-5">{service.techStack.join(' · ')}</p>
              </details>
              <div className="page-actions mt-6">
                <ButtonLink
                  variant="secondary"
                  to={`/dashboard/requests/new?service=${encodeURIComponent(service.title)}`}
                >
                  Discuss a project
                  <ArrowRight />
                </ButtonLink>
                <span className="text-xs text-aura-muted">
                  {service.timeline}
                </span>
              </div>
            </div>
            <img loading="lazy" src={service.image} alt={service.shortTitle} />
          </section>
        ))}
      </div>
    </main>
  )
}
