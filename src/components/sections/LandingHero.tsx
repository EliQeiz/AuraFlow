import { ArrowDown, ArrowRight, Brush, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { TypeAnimation } from 'react-type-animation'
import { ButtonLink } from '../ui/Button'
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
  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-hero-mesh">
      <ParticleBackground />
      <GlowOrb className="-left-32 top-12" />
      <GlowOrb className="-right-36 bottom-0 bg-[radial-gradient(circle,rgba(0,212,255,0.3),transparent_68%)]" />
      <div className="section-shell relative z-10 grid py-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-5xl text-center">
          <motion.div variants={item} className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-lg border border-white/15 bg-white/10 shadow-aura">
            <span className="font-orbitron text-3xl font-black text-white">AF</span>
          </motion.div>
          <motion.h1 variants={item} className="text-balance text-4xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
            We Build Digital Experiences That{' '}
            <span className="bg-aura-gradient bg-clip-text text-transparent">
              <TypeAnimation
                sequence={['Move', 1000, 'Inspire', 1000, 'Convert', 1000, 'Scale', 1000, 'Impress', 1200]}
                speed={36}
                repeat={Number.POSITIVE_INFINITY}
              />
            </span>{' '}
            People
          </motion.h1>
          <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-lg text-aura-muted sm:text-xl">
            Premium websites. Powerful apps. Intelligent data. All under one roof.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/quote">
              <Rocket className="h-4 w-4" />
              Start Your Project
            </ButtonLink>
            <ButtonLink to="/templates" variant="secondary">
              <Brush className="h-4 w-4" />
              Browse Templates
            </ButtonLink>
          </motion.div>
        </motion.div>

        <FloatingCard className="absolute left-4 top-20 hidden -rotate-6 md:block" delay={0.3}>
          50+ Templates
        </FloatingCard>
        <FloatingCard className="absolute right-8 top-36 hidden rotate-3 md:block" delay={0.8}>
          Fast Delivery
        </FloatingCard>
        <FloatingCard className="absolute bottom-24 left-[12%] hidden rotate-2 lg:block" delay={1.2}>
          Firebase-Powered
        </FloatingCard>
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
      <ArrowRight className="sr-only" />
    </section>
  )
}
