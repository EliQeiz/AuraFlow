import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { Link } from 'react-router-dom'
import { services } from '../../data/services'
import { scrollRevealVariants } from '../../hooks/useScrollReveal'
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
              <div className="relative aspect-[16/10] overflow-hidden rounded-md">
                <LazyLoadImage alt={service.title} src={service.image} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
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
