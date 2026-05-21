import { Mail, MapPin, Phone } from 'lucide-react'
import { ContactForm } from '../components/forms/ContactForm'
import { Badge } from '../components/ui/Badge'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'

export default function Contact() {
  return (
    <PageWrapper>
      <SEOHead title="Contact" description="Contact AuraFlow in Ghana for websites, mobile apps, Firebase work, dashboards, AI integrations, and templates." />
      <section className="section-shell grid gap-6 py-16 lg:grid-cols-[0.8fr_1fr]">
        <aside className="glass rounded-lg p-6">
          <Badge>Contact</Badge>
          <h1 className="mt-5 text-4xl font-extrabold">Let's build something exceptional together.</h1>
          <div className="mt-7 grid gap-3 text-aura-muted">
            <a href="mailto:elishaafari0@gmail.com" className="flex items-center gap-3 hover:text-white">
              <Mail className="h-5 w-5 text-cyan-100" />
              elishaafari0@gmail.com
            </a>
            <a href="tel:+233506624529" className="flex items-center gap-3 hover:text-white">
              <Phone className="h-5 w-5 text-cyan-100" />
              0506624529
            </a>
            <a href="tel:+233547395699" className="flex items-center gap-3 hover:text-white">
              <Phone className="h-5 w-5 text-cyan-100" />
              0547395699
            </a>
            <span className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-cyan-100" />
              Ghana
            </span>
          </div>
          <div className="mt-7 overflow-hidden rounded-lg border border-white/10">
            <iframe
              title="Ghana map"
              src="https://www.google.com/maps?q=Ghana&output=embed"
              loading="lazy"
              className="h-72 w-full grayscale-[0.25]"
            />
          </div>
        </aside>
        <ContactForm />
      </section>
    </PageWrapper>
  )
}
