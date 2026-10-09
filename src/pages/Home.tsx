import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Cpu,
  FileWarning,
  GraduationCap,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { portfolioLabs } from '../data/labs'
import founder from '../assets/images/elisha-afari.jpg'

const icons = [Boxes, FileWarning, Cpu, Smartphone]

export default function Home() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(0)
  const lab = portfolioLabs[selected]
  const Icon = icons[selected]

  return (
    <main className="portfolio-home">
      <SEOHead
        title="AuraFlow Labs | Engineering systems for real-world operations"
        description="AuraFlow is a Ghanaian software engineering portfolio spanning multi-tenant operations, industrial intelligence, applied machine learning, and offline-first mobile workflows."
      />
      <section className="portfolio-hero section-shell">
        <div className="portfolio-hero__copy">
          <p className="eyebrow">AuraFlow Labs · Ghana to global</p>
          <h1>Software systems built for real-world complexity.</h1>
          <p>
            Applied ML, multi-tenant operations, audited industrial workflows,
            and field-ready mobile products. Built as systems that can be
            inspected, tested, and extended.
          </p>
          <div className="hero-actions">
            <ButtonLink to="/labs">Explore flagship systems <ArrowRight /></ButtonLink>
            <ButtonLink to="/about" variant="secondary">About the engineer <ArrowUpRight /></ButtonLink>
          </div>
        </div>
        <div className="portfolio-console" aria-label="Interactive portfolio system preview">
          <header><span>AuraFlow Labs</span><small>Selected system</small></header>
          <div className="portfolio-console__nav">
            {portfolioLabs.map((item, index) => {
              const ItemIcon = icons[index]
              return <button key={item.slug} aria-pressed={index === selected} onClick={() => setSelected(index)}><ItemIcon /> {item.index}</button>
            })}
          </div>
          <div className="portfolio-console__body">
            <div><p>{lab.category}</p><h2>{lab.title}</h2><span>{lab.metric}</span></div>
            <Icon className="portfolio-console__icon" />
          </div>
          <div className="portfolio-console__signals">
            {lab.capabilities.slice(0, 3).map((capability) => <span key={capability}><CheckCircle2 /> {capability}</span>)}
          </div>
          <Link to={`/labs/${lab.slug}`}>Open case study <ArrowRight /></Link>
        </div>
      </section>
      <section className="portfolio-signal-band"><div className="section-shell"><span><Boxes /> Multi-tenant systems</span><span><FileWarning /> Industrial intelligence</span><span><Cpu /> Applied ML</span><span><Smartphone /> Offline-first mobile</span></div></section>
      <section className="portfolio-section section-shell">
        <div className="portfolio-section__heading"><div><p className="eyebrow">Flagship systems</p><h2>Proof, not empty promises.</h2></div><p>Every lab is a focused case study: the operational problem, the design constraints, the engineering approach, and a safe interactive demonstration.</p></div>
        <div className="portfolio-project-grid">
          {portfolioLabs.map((item, index) => {
            const ItemIcon = icons[index]
            return <article key={item.slug}><div className={`portfolio-project-card__graphic portfolio-project-card__graphic--${item.slug}`}><span>{item.index}</span><ItemIcon /><i /><i /><i /></div><p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.summary}</p><Link to={`/labs/${item.slug}`}>Explore the system <ArrowRight /></Link></article>
          })}
        </div>
      </section>
      <section className="portfolio-evidence"><div className="section-shell"><div><p className="eyebrow">A more useful portfolio</p><h2>Evidence before promises.</h2><p>AuraFlow uses working sandboxes, explicit architecture, and technical case studies so clients, employers, and partners can understand what is actually being built.</p></div><div className="portfolio-evidence__list"><span><ShieldCheck /> Safe, login-free demonstrations</span><span><Cpu /> Clear technical boundaries and trade-offs</span><span><CheckCircle2 /> Real workflows over decorative mockups</span></div></div></section>
      <section className="portfolio-founder section-shell"><img src={founder} alt="Elisha Afari, founder and engineer at AuraFlow" loading="lazy" /><div><p className="eyebrow">The person behind the systems</p><h2>Built with practical curiosity.</h2><p>I am Elisha Afari, a Ghanaian software engineer building useful systems where operations, data, and people meet. AuraFlow Labs is where that work is made visible, inspectable, and ready for the next challenge.</p><Link to="/about">Meet Elisha <ArrowUpRight /></Link></div></section>
      <section className="portfolio-platforms section-shell"><div><p className="eyebrow">Beyond the portfolio</p><h2>Products with a purpose.</h2></div><div className="portfolio-platforms__cards"><article><GraduationCap /><h3>AuraFlow Class</h3><p>Practical technical learning, course operations, and high-integrity assessment.</p><ButtonLink to="/afc" variant="secondary">Enter AFC <ArrowRight /></ButtonLink></article><article><Boxes /><h3>Business Center</h3><p>Configurable operational platforms for schools, hospitality, commerce, and growing teams.</p><ButtonLink to={user ? '/dashboard' : '/business-center'}>Explore Business Center <ArrowRight /></ButtonLink></article></div></section>
    </main>
  )
}
