import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { services } from '../../data/services'
import { scrollRevealVariants } from '../../hooks/useScrollReveal'
import { cn } from '../../lib/utils'
import type { Service } from '../../types'
import { ServiceIcon } from '../shared/ServiceIcon'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function ServicesGrid() {
  return (
    <section className="section-shell py-20">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scrollRevealVariants} className="mb-9">
        <Badge>Services</Badge>
        <h2 className="mt-4 inline-block text-3xl font-extrabold sm:text-5xl">
          What We Build
          <span className="mt-3 block h-1 w-28 rounded-full bg-aura-gradient" />
        </h2>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.16 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
      >
        {services.slice(0, 6).map((service) => (
          <motion.div key={service.id} variants={scrollRevealVariants} whileHover={{ scale: 1.04, y: -8 }}>
            <Card className="group h-full p-4">
              <ServiceMedia service={service} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-aura-gradient text-white">
                  <ServiceIcon name={service.icon} />
                </span>
                <Badge>{service.timeline}</Badge>
              </div>
              <h3 className="mt-4 text-base font-bold sm:text-xl">{service.shortTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-aura-muted">{service.description}</p>
              <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-100" to="/services">
                Explore service
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function ServiceMedia({ service }: { service: Service }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-card-gradient">
      <div
        className={cn(
          'absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_28%_18%,rgba(0,212,255,0.26),transparent_34%),linear-gradient(135deg,rgba(108,99,255,0.32),rgba(0,212,255,0.08))] transition duration-300',
          loaded && !failed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="grid place-items-center gap-3 text-center text-cyan-50">
          <span className="grid h-16 w-16 place-items-center rounded-lg border border-cyan-200/30 bg-black/25">
            <ServiceIcon name={service.icon} className="h-8 w-8" />
          </span>
          <span className="px-5 text-sm font-bold">{service.shortTitle}</span>
        </div>
      </div>
      {!failed ? (
        <img
          alt={service.title}
          decoding="async"
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          src={service.image}
          className={cn('absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
    </div>
  )
}
