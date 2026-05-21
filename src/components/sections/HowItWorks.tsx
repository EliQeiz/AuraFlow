import { motion } from 'framer-motion'
import { Rocket, Search, Shapes, Wrench } from 'lucide-react'

const steps = [
  { title: 'Consult', copy: 'We learn your vision.', Icon: Search },
  { title: 'Design', copy: 'Wireframes and prototypes.', Icon: Shapes },
  { title: 'Build', copy: 'Full-stack development.', Icon: Wrench },
  { title: 'Launch', copy: 'Firebase and Vercel deployment.', Icon: Rocket },
]

export function HowItWorks() {
  return (
    <section className="section-shell py-20">
      <h2 className="text-3xl font-extrabold sm:text-5xl">How It Works</h2>
      <div className="relative mt-10 grid gap-5 md:grid-cols-4">
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="absolute left-10 right-10 top-10 hidden h-px origin-left bg-aura-gradient md:block"
        />
        {steps.map(({ Icon, copy, title }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
            className="relative rounded-lg border border-white/10 bg-white/[0.06] p-5"
          >
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-md bg-aura-gradient font-orbitron font-bold text-white">
              {index + 1}
            </span>
            <Icon className="mb-3 h-5 w-5 text-cyan-100" />
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-aura-muted">{copy}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
