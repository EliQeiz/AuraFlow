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
import { ProductRecording } from '../components/shared/ProductRecording'
import { useAuth } from '../context/AuthContext'
import { portfolioLabs } from '../data/labs'
import founder from '../assets/images/elisha-afari.jpg'

const icons = [Boxes, FileWarning, Cpu, Smartphone]

const featuredRecordings = [
  {
    id: 'crestview',
    title: 'Crestview school operations',
    label: 'Recorded Crestview operations dashboard',
    duration: '00:06',
    src: '/media/crestview-school.mp4',
    to: '/labs/cloud-erp',
  },
  {
    id: 'auraflow',
    title: 'AuraFlow product showcase',
    label: 'Recorded AuraFlow workspace showcase',
    duration: '00:08',
    src: '/media/auraflow-platform.mp4',
    to: '/business-center',
  },
]

export default function Home() {
  const { user } = useAuth()
  const [selectedRecording, setSelectedRecording] = useState(0)
  const recording = featuredRecordings[selectedRecording]

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
        <div className="portfolio-hero__recording" aria-label="Featured product recordings">
          <div className="portfolio-recording-tabs" role="tablist" aria-label="Choose a product recording">
            {featuredRecordings.map((item, index) => (
              <button key={item.id} type="button" role="tab" aria-selected={selectedRecording === index} onClick={() => setSelectedRecording(index)}>
                <span>0{index + 1}</span>{item.title}
              </button>
            ))}
          </div>
          <ProductRecording
            key={recording.id}
            src={recording.src}
            title={recording.title}
            label={recording.label}
            duration={recording.duration}
          />
          <Link className="portfolio-recording-link" to={recording.to}>Explore this product <ArrowRight /></Link>
        </div>
      </section>
      <section className="portfolio-signal-band"><div className="section-shell"><span><Boxes /> Multi-tenant systems</span><span><FileWarning /> Industrial intelligence</span><span><Cpu /> Applied ML</span><span><Smartphone /> Offline-first mobile</span></div></section>
      <section className="portfolio-section section-shell">
        <div className="portfolio-section__heading"><div><p className="eyebrow">Flagship systems</p><h2>Proof, not empty promises.</h2></div><p>Every lab explains the operational problem, design constraints, engineering approach, and the evidence currently available: source recordings, published code, or an explicitly planned direction.</p></div>
        <div className="portfolio-project-grid">
          {portfolioLabs.map((item, index) => {
            const ItemIcon = icons[index]
            return <article key={item.slug}>
              {item.recording ? (
                <ProductRecording src={item.recording.src} title={item.title} label={item.recording.label} duration={item.recording.duration} controls={false} />
              ) : (
                <div className="portfolio-project-card__status" aria-label={`${item.title} product status`}>
                  <span>{item.index}</span><ItemIcon /><p>{item.statusLabel}</p>
                </div>
              )}
              <p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.summary}</p><Link to={`/labs/${item.slug}`}>Explore the system <ArrowRight /></Link>
            </article>
          })}
        </div>
      </section>
      <section className="portfolio-evidence"><div className="section-shell"><div><p className="eyebrow">A more useful portfolio</p><h2>Evidence before promises.</h2><p>AuraFlow pairs real recordings, explicit architecture, and technical case studies so clients, employers, and partners can understand what is actually built and what is still in design.</p></div><div className="portfolio-evidence__list"><span><ShieldCheck /> Recorded product evidence</span><span><Cpu /> Clear technical boundaries and trade-offs</span><span><CheckCircle2 /> Honest status over decorative mockups</span></div></div></section>
      <section className="portfolio-founder section-shell"><img src={founder} alt="Elisha Afari, founder and engineer at AuraFlow" loading="lazy" /><div><p className="eyebrow">The person behind the systems</p><h2>Built with practical curiosity.</h2><p>I am Elisha Afari, a Ghanaian software engineer building useful systems where operations, data, and people meet. AuraFlow Labs is where that work is made visible, inspectable, and ready for the next challenge.</p><Link to="/about">Meet Elisha <ArrowUpRight /></Link></div></section>
      <section className="portfolio-platforms section-shell"><div><p className="eyebrow">Beyond the portfolio</p><h2>Products with a purpose.</h2></div><div className="portfolio-platforms__cards"><article><GraduationCap /><h3>AuraFlow Class</h3><p>Practical technical learning, course operations, and high-integrity assessment.</p><ButtonLink to="/afc" variant="secondary">Enter AFC <ArrowRight /></ButtonLink></article><article><Boxes /><h3>Business Center</h3><p>Configurable operational platforms for schools, hospitality, commerce, and growing teams.</p><ButtonLink to={user ? '/dashboard' : '/business-center'}>Explore Business Center <ArrowRight /></ButtonLink></article></div></section>
    </main>
  )
}
