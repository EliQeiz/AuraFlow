import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'
import { SEOHead } from '../components/shared/SEOHead'

export default function Contact() {
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title="Contact"
        description="Talk to AuraFlow in Ghana about your next website or business platform."
      />
      <header className="public-page-heading">
        <span className="eyebrow">Let's talk</span>
        <h1>
          Your next project starts
          <br />
          with a conversation.
        </h1>
        <p>
          Tell us what you have in mind. We will help you find the right next
          step.
        </p>
      </header>
      <div className="contact-layout">
        <section>
          <div className="contact-method">
            <Mail />
            <div>
              <h2>Email</h2>
              <a href="mailto:elishaafari0@gmail.com">elishaafari0@gmail.com</a>
            </div>
          </div>
          <div className="contact-method">
            <Phone />
            <div>
              <h2>Call us</h2>
              <a href="tel:+233506624529">+233 50 662 4529</a>
              <a href="tel:+233547395699">+233 54 739 5699</a>
            </div>
          </div>
          <div className="contact-method">
            <MapPin />
            <div>
              <h2>Based in Ghana</h2>
              <p>Working with businesses across Africa.</p>
            </div>
          </div>
          <a
            className="af-button af-button--secondary mt-4"
            href="https://wa.me/233506624529"
            target="_blank"
            rel="noreferrer"
          >
            Talk on WhatsApp
            <ArrowRight size={15} />
          </a>
        </section>
        <section>
          <h2 className="text-2xl mb-4">Bring your idea into the workspace.</h2>
          <p className="text-sm text-aura-muted leading-8 max-w-lg">
            Share your brief and files, explore design options, and keep the
            whole conversation attached to your project.
          </p>
          <div className="page-actions mt-7">
            <ButtonLink to="/dashboard/requests/new">
              Start a project
              <ArrowRight />
            </ButtonLink>
            <ButtonLink variant="secondary" to="/dashboard/messages">
              Message our team
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  )
}
