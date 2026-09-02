import { ArrowDown, Brush, CheckCircle2, Layers3, MessageSquareMore, MonitorSmartphone, Rocket, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '../ui/Badge'
import { ButtonLink } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { FloatingCard } from '../animations/FloatingCard'
import { GlowOrb } from '../animations/GlowOrb'
import { ParticleBackground } from '../animations/ParticleBackground'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
}

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export function LandingHero() {
  const { user } = useAuth()

  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-hero-mesh">
      <ParticleBackground />
      <GlowOrb className="-left-32 top-12" />
      <GlowOrb className="-right-36 bottom-0 bg-[radial-gradient(circle,rgba(0,212,255,0.3),transparent_68%)]" />
      <div className="section-shell relative z-10 grid items-center gap-8 py-14 lg:grid-cols-[1fr_0.86fr]">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={item}>
            <Badge>Ghana-first software studio</Badge>
          </motion.div>
          <motion.h1 variants={item} className="mt-5 max-w-5xl text-balance text-4xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
            Websites, apps, and hosted systems for businesses that need more than a page.
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-2xl text-lg leading-8 text-aura-muted sm:text-xl">
            Built for schools, restaurants, shops, hotels, guesthouses, portfolios, and founders who want a serious platform without starting from zero.
          </motion.p>
          <motion.p variants={item} className="mt-3 max-w-2xl leading-7 text-aura-muted">
            AuraFlow combines a public business website with a private client app where customers choose suites, upload references, shape workflows, review previews, and chat through the build.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={user ? '/dashboard/requests/new' : '/register'}>
              <Rocket className="h-4 w-4" />
              {user ? 'Start A Private Request' : 'Create Client Portal'}
            </ButtonLink>
            <ButtonLink to="/solutions" variant="secondary">
              <Layers3 className="h-4 w-4" />
              Explore Suite Systems
            </ButtonLink>
            <ButtonLink to="/templates" variant="ghost">
              <Brush className="h-4 w-4" />
              Website Templates
            </ButtonLink>
          </motion.div>
          <motion.div variants={item} className="mt-8 grid gap-3 sm:grid-cols-3">
            {['No fake proof points', 'Owner/admin private data', 'Built for local businesses'].map((point) => (
              <span key={point} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-aura-muted">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-100" />
                {point}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="relative">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.075] shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-3">
              <span className="font-mono text-xs text-cyan-100">auraflow.app/client</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-100">Private</span>
            </div>
            <div className="grid gap-4 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroMetric icon={MonitorSmartphone} label="Suites" value="School, retail, food" />
                <HeroMetric icon={MessageSquareMore} label="Requests" value="Files + chat" />
                <HeroMetric icon={ShieldCheck} label="Admin" value="Preview delivery" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-aura-muted">Current build lane</p>
                    <h3 className="mt-1 text-2xl font-bold">School Management Suite</h3>
                  </div>
                  <Badge>Designing</Badge>
                </div>
                <div className="mt-5 grid gap-3">
                  {['Choose modules and role portals', 'Upload logo, banners, photos, data', 'Review AuraFlow preview and request changes'].map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-aura-gradient font-orbitron text-xs font-bold text-white">{index + 1}</span>
                      <span className="text-sm text-aura-muted">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">Hosted model</p>
                  <strong className="mt-2 block text-white">client.auraflow.app</strong>
                </div>
                <div className="rounded-lg border border-violet-200/20 bg-violet-300/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-100">Upgrade path</p>
                  <strong className="mt-2 block text-white">Custom owned build</strong>
                </div>
              </div>
            </div>
          </div>
          <FloatingCard className="absolute -left-4 -top-5 hidden -rotate-6 md:block" delay={0.4}>
            Suite Builder
          </FloatingCard>
          <FloatingCard className="absolute -right-4 top-28 hidden rotate-3 md:block" delay={0.9}>
            Client Portal
          </FloatingCard>
        </motion.div>
      </div>
      <motion.a
        href="#stats"
        animate={{ y: [0, 8, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 p-3 text-white"
        aria-label="Scroll to stats"
      >
        <ArrowDown className="h-4 w-4" />
      </motion.a>
    </section>
  )
}

function HeroMetric({ icon: Icon, label, value }: { icon: typeof MonitorSmartphone; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <Icon className="h-4 w-4 text-cyan-100" />
      <span className="mt-3 block text-xs text-aura-muted">{label}</span>
      <strong className="mt-1 block truncate text-sm text-white">{value}</strong>
    </div>
  )
}
