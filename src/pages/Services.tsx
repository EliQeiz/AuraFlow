import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { ButtonLink } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { ServiceIcon } from '../components/shared/ServiceIcon'
import { services } from '../data/services'

export default function Services() {
  return (
    <PageWrapper>
      <SEOHead title="Services" description="Explore AuraFlow web, mobile, Firebase, data, AI, design, commerce, and support services." />
      <section className="section-shell pb-14 pt-16">
        <Badge>Delivery</Badge>
        <h1 className="mt-5 max-w-4xl text-4xl font-extrabold sm:text-6xl">Build the site, app, and data layer your next stage needs.</h1>
        <p className="mt-5 max-w-2xl text-lg text-aura-muted">Each service pairs product judgment with practical execution, from a focused launch page to authenticated client software.</p>
      </section>

      <section className="grid gap-12 pb-20">
        {services.map((service, index) => (
          <motion.article
            key={service.id}
            initial={{ opacity: 0, x: index % 2 ? 48 : -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            className="section-shell grid items-center gap-6 lg:grid-cols-2"
          >
            <div className={`relative overflow-hidden rounded-lg border border-white/10 ${index % 2 ? 'lg:order-2' : ''}`}>
              <LazyLoadImage alt={service.title} src={service.image} className="h-[26rem] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-aura-dark via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 grid h-14 w-14 place-items-center rounded-lg bg-aura-gradient text-white shadow-aura">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </span>
            </div>
            <div className={index % 2 ? 'lg:order-1' : ''}>
              <div className="flex flex-wrap gap-2">
                <Badge>{service.timeline}</Badge>
                <Badge>{service.priceRange}</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-bold">{service.title}</h2>
              <p className="mt-4 leading-8 text-aura-muted">{service.description}</p>
              <details className="glass group mt-5 rounded-lg p-5" open={index < 2}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-syne font-bold text-white">
                  What's included
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <div className="mt-4 grid gap-4">
                  <ul className="grid gap-2 text-sm text-aura-muted">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-cyan-100" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {service.techStack.map((tech) => (
                      <Badge key={tech} className="border-white/15 bg-white/[0.07] text-white">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <ButtonLink to={`/quote?service=${service.id}`} className="w-fit">
                    Get a Quote for This Service
                  </ButtonLink>
                </div>
              </details>
            </div>
          </motion.article>
        ))}
      </section>
    </PageWrapper>
  )
}
