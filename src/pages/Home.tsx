import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  GraduationCap,
  Layers2,
  Monitor,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SEOHead } from '../components/shared/SEOHead'
import { SuiteCanvas } from '../components/shared/SuiteCanvas'
import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { defaultDraft } from '../domain/studio'
import { suiteBlueprints } from '../data/suiteBlueprints'
import founder from '../assets/images/elisha-afari.jpg'
import { MotionMedia } from '../components/shared/MotionMedia'
import { TemplateCover } from '../components/shared/TemplateCover'
import { templates } from '../data/templates'

const featured = [
  {
    slug: 'school-management-system',
    name: 'Education',
    description: 'A connected school, from admissions to the parent portal.',
    Icon: GraduationCap,
  },
  {
    slug: 'restaurant-ordering-booking',
    name: 'Restaurants & cafes',
    description: 'Menus, reservations, and a better guest experience.',
    Icon: UtensilsCrossed,
  },
  {
    slug: 'hotel-lodge-guesthouse-booking',
    name: 'Hotels & guest houses',
    description: 'Bring your property, rooms, and reservations together.',
    Icon: Building2,
  },
  {
    slug: 'ecommerce-storefront',
    name: 'Commerce',
    description: 'A storefront and operations that work together.',
    Icon: ShoppingBag,
  },
]
const examples = [
  'Adinkra Academy',
  'The Accra Table',
  'Akwaaba House',
  'Form & Everyday',
]

export default function Home() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(0)
  const suite = suiteBlueprints.find(
    (item) => item.slug === featured[selected].slug,
  )!
  const draft = defaultDraft(
    suite.slug,
    examples[selected],
    suite.modules.slice(0, 3).map((item) => item.title),
    [],
  )
  draft.primaryColor = ['#5c58c9', '#b55c49', '#387e7d', '#6960bd'][selected]
  return (
    <main>
      <SEOHead
        title="Websites & Business Software"
        description="Design your next website or business system with AuraFlow. Explore industry suites, shape your prototype, and work directly with our team in Ghana."
      />
      <section className="home-hero">
        <div className="hero-intro">
          <p className="eyebrow">Built in Ghana. Built around your business.</p>
          <h1>
            Business software.
            <br />
            <span>Your way.</span>
          </h1>
          <p>
            Start with a template. Make it your own.
            <br />
            Work with AuraFlow to turn your vision into a working website, app,
            or business system.
          </p>
          <div className="hero-actions">
            <ButtonLink to={user ? '/dashboard' : '/register'}>
              Start your project
              <ArrowRight />
            </ButtonLink>
            <ButtonLink to="/solutions" variant="secondary">
              Explore the platform
              <ArrowUpRight />
            </ButtonLink>
          </div>
        </div>
        <div className="hero-product">
          <div className="hero-editor">
            <div className="editor-topbar">
              <div>
                <Layers2 size={14} />
                <strong>AuraFlow Studio</strong>
                <span>/ {examples[selected]}</span>
              </div>
              <div>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <Check size={11} /> Design preview
                </span>
                <Monitor size={13} />
                <Smartphone size={12} />
              </div>
            </div>
            <div className="editor-body">
              <aside className="editor-left">
                <p className="editor-label">BUSINESS SUITES</p>
                {featured.map(({ name, Icon }, index) => (
                  <button
                    key={name}
                    aria-pressed={selected === index}
                    onClick={() => setSelected(index)}
                  >
                    <Icon size={14} />
                    {name}
                  </button>
                ))}
              </aside>
              <div className="editor-canvas">
                <SuiteCanvas key={selected} draft={draft} />
              </div>
              <aside className="editor-right">
                <p className="editor-label">PROJECT DESIGN</p>
                <div className="editor-property">
                  <span>Business</span>
                  <span>{featured[selected].name.split(' ')[0]}</span>
                </div>
                <div className="editor-property">
                  <span>Primary color</span>
                  <i
                    className="color-chip"
                    style={{ background: draft.primaryColor }}
                  />
                </div>
                <div className="editor-property">
                  <span>Typography</span>
                  <span>Modern</span>
                </div>
                <p className="editor-label mt-8">INCLUDED MODULES</p>
                {suite.modules.slice(0, 4).map((module) => (
                  <div className="editor-property" key={module.id}>
                    <span>{module.title}</span>
                    <Check size={12} className="text-[var(--positive)]" />
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </section>
      <div className="industry-band">
        <div className="section-shell">
          <span>
            <GraduationCap size={17} />
            Schools & education
          </span>
          <span>
            <ShoppingBag size={17} />
            Shops & commerce
          </span>
          <span>
            <UtensilsCrossed size={17} />
            Food & hospitality
          </span>
          <span>
            <Building2 size={17} />
            Every kind of business
          </span>
        </div>
      </div>
      <section className="home-section">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A starting point that fits</p>
              <h2>
                Your industry.
                <br />
                Your kind of platform.
              </h2>
              <p>
                Choose a business suite and shape the pages, brand, and
                workflows around the way you work.
              </p>
            </div>
            <ButtonLink to="/solutions" variant="ghost">
              View all suites
              <ArrowRight />
            </ButtonLink>
          </div>
          <div className="suite-grid">
            {featured.slice(0, 3).map((item) => {
              const data = suiteBlueprints.find((s) => s.slug === item.slug)!
              return (
                <article key={item.slug} className="suite-tile">
                  <div className="suite-tile-media">
                    <MotionMedia images={[data.image]} alt={item.name} />
                  </div>
                  <h3>
                    <Link to={`/solutions/${item.slug}`}>{item.name}</Link>
                    <ArrowUpRight size={17} />
                  </h3>
                  <p>{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">From first idea to launch</p>
              <h2>
                Build with a team,
                <br />
                at every step.
              </h2>
            </div>
            <p>
              Keep your designs, files, feedback, and conversations in one
              project workspace.
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                '01',
                'Make it yours',
                'Choose your suite, set your colors, and assemble the pages and features you need.',
              ],
              [
                '02',
                'Tell us the details',
                'Share your brief, content, photos, and references directly in your workspace.',
              ],
              [
                '03',
                'Review together',
                'Talk to our team, follow progress, and request changes to your previews.',
              ],
              [
                '04',
                'Launch your business',
                'Agree a hosted or custom delivery plan, with the support your business needs.',
              ],
            ].map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="section-shell">
          <div className="founder-band">
            <img
              src={founder}
              alt="Elisha Afari, founder of AuraFlow"
              loading="lazy"
            />
            <div>
              <p className="eyebrow">A note from our founder</p>
              <h2>Good software should be within reach.</h2>
              <p>
                We are building AuraFlow for the schools, shops, and businesses
                that make our communities work. Start where you are. Let's build
                what comes next.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-xs mt-5"
              >
                Elisha Afari · Founder
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="home-section website-showcase">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A website with your point of view</p>
              <h2>
                Make a lasting
                <br />
                first impression.
              </h2>
            </div>
            <ButtonLink to="/templates" variant="secondary">
              Browse website templates
              <ArrowUpRight />
            </ButtonLink>
          </div>
          <div className="website-showcase-grid">
            {[
              'cafe-restaurant',
              'boutique-hotel-hotel',
              'general-practice-clinic',
            ].map((slug, index) => {
              const template = templates.find((item) => item.slug === slug)!
              return (
                <article key={slug}>
                  <TemplateCover template={template} autoplay={index === 0} />
                  <div className="showcase-caption">
                    <Link to={`/templates/${slug}`}>
                      {template.name}
                      <ArrowUpRight size={16} />
                    </Link>
                    <span>{template.category}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
      <section className="home-close">
        <h2>What will you build?</h2>
        <ButtonLink to={user ? '/dashboard/studio' : '/register'}>
          Open your workspace
          <ArrowRight />
        </ButtonLink>
      </section>
    </main>
  )
}
