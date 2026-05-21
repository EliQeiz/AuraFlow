import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { FaLinkedin } from 'react-icons/fa6'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import elishaAfariPhoto from '../assets/images/elisha-afari.jpg'
import { IMAGES } from '../lib/images'

const milestones = [
  ['2021', 'AuraFlow begins with conversion-focused websites.'],
  ['2023', 'Firebase-backed client portals and dashboards join the studio.'],
  ['2025', 'Template systems speed launches across 30 business categories.'],
  ['2026', 'Web, mobile, analytics, and AI workflows share one delivery lane.'],
]

const values = ['Quality', 'Innovation', 'Speed', 'Transparency', 'Partnership', 'Excellence']
const stack = ['React', 'TypeScript', 'Vite', 'TailwindCSS', 'Firebase', 'Firestore', 'Flutter', 'Python', 'Figma', 'Vercel', 'Recharts', 'Framer Motion']

export default function About() {
  return (
    <PageWrapper>
      <SEOHead title="About" description="Meet AuraFlow, a Ghana-based studio for web, mobile, Firebase, data, design, and launch systems." />
      <section className="relative min-h-[70vh] overflow-hidden">
        <img src={IMAGES.about.team} alt="AuraFlow team collaborating" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-aura-dark via-aura-dark/76 to-transparent" />
        <div className="section-shell relative flex min-h-[70vh] flex-col justify-end py-14">
          <Badge className="w-fit">Ghana</Badge>
          <h1 className="mt-5 text-5xl font-extrabold sm:text-7xl">We're AuraFlow</h1>
        </div>
      </section>

      <section className="section-shell py-20 text-center">
        <p className="mx-auto max-w-5xl font-syne text-3xl font-semibold leading-tight text-white sm:text-5xl">
          We make digital work feel clear at the point where ambition meets implementation.
        </p>
      </section>

      <section className="section-shell grid gap-8 pb-20 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <h2 className="text-3xl font-extrabold">Story</h2>
          <p className="mt-4 leading-8 text-aura-muted">AuraFlow blends product thinking, visual craft, and production engineering for clients who need more than a pretty first screen.</p>
          <img loading="lazy" src={IMAGES.about.office} alt="AuraFlow office" className="mt-6 h-72 w-full rounded-lg border border-white/10 object-cover" />
        </div>
        <div className="relative grid gap-5 pl-8">
          <motion.span initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} className="absolute bottom-0 left-3 top-0 w-px origin-top bg-aura-gradient" />
          {milestones.map(([year, text]) => (
            <motion.article key={year} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-lg border border-white/10 bg-white/[0.06] p-5">
              <span className="absolute -left-[1.92rem] top-7 h-4 w-4 rounded-full border border-cyan-100 bg-aura-dark" />
              <Badge>{year}</Badge>
              <p className="mt-3 text-lg text-white">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-aura-surface/55 py-20">
        <div className="section-shell">
          <h2 className="text-3xl font-extrabold">Values</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <Card key={value} className="p-5" tilt={index % 2 === 0}>
                <Sparkles className="h-5 w-5 text-cyan-100" />
                <h3 className="mt-4 text-2xl font-bold">{value}</h3>
                <p className="mt-2 text-aura-muted">A visible standard in decisions, handoffs, and launch work.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-5 py-20 lg:grid-cols-[380px_1fr]">
        <Card className="overflow-hidden">
          <img loading="lazy" src={elishaAfariPhoto} alt="Elisha Afari" className="aspect-[3/4] w-full object-cover object-top" />
          <div className="p-5">
            <h2 className="text-2xl font-bold">Elisha Afari</h2>
            <p className="mt-1 text-aura-muted">Founder, AuraFlow</p>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-cyan-100">
              <FaLinkedin className="h-4 w-4" />
              Social profile
            </a>
          </div>
        </Card>
        <div>
          <h2 className="text-3xl font-extrabold">Tech Stack</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stack.map((tech) => (
              <motion.div key={tech} whileHover={{ y: -4 }} className="rounded-lg border border-white/10 bg-white/[0.06] p-4 font-bold text-white">
                {tech}
              </motion.div>
            ))}
          </div>
          <div className="mt-8 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-6">
            <h3 className="text-2xl font-bold">Join 200+ happy clients</h3>
            <p className="mt-2 text-aura-muted">Start with a quote and leave with a launch path you can inspect.</p>
            <ButtonLink to="/quote" className="mt-5">
              Start a Project
            </ButtonLink>
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
