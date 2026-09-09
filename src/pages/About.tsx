import { ArrowRight } from 'lucide-react'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import founder from '../assets/images/elisha-afari.jpg'
export default function About() {
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title="About AuraFlow"
        description="Founded by Elisha Afari in Ghana. Building accessible websites and business software with the people who use it."
      />
      <header className="public-page-heading">
        <span className="eyebrow">Our story</span>
        <h1>
          AuraFlow.
          <br />
          Built close to the businesses we serve.
        </h1>
        <p>
          We believe a school, shop, restaurant, or growing company should be
          able to shape its own digital future.
        </p>
      </header>
      <div className="about-founder">
        <img src={founder} alt="Elisha Afari, founder of AuraFlow" />
        <section>
          <span className="eyebrow">Elisha Afari · Founder</span>
          <h2>
            Good software begins
            <br />
            with understanding your business.
          </h2>
          <p>
            AuraFlow is a Ghana-based software business connecting practical
            development with tools that help clients express what they need.
          </p>
          <p>
            Our platform brings design, project requests, and conversations into
            one workspace. You can choose a starting point, shape it around your
            business, and work with us through delivery.
          </p>
          <p>
            We are building for Ghana and Africa first, with the ambition to
            serve businesses around the world.
          </p>
          <ButtonLink to="/contact" variant="secondary" className="mt-6">
            Talk to us
            <ArrowRight />
          </ButtonLink>
        </section>
      </div>
      <section className="home-section">
        <div className="section-heading">
          <h2>How we want to work.</h2>
        </div>
        <div className="process-grid">
          {[
            [
              'Clarity',
              'An agreed brief, transparent scope, and updates you can understand.',
            ],
            [
              'Care',
              'Real attention to the people who will use your software every day.',
            ],
            [
              'Partnership',
              'A conversation that continues through design, development, and delivery.',
            ],
            [
              'Practicality',
              'Start with what matters to your business, then grow from there.',
            ],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
