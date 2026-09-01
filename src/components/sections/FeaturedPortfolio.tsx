import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { portfolioProjects } from '../../data/portfolio'
import { Badge } from '../ui/Badge'

const filters = ['All', 'Websites', 'Mobile Apps', 'Dashboards']

export function FeaturedPortfolio() {
  const [filter, setFilter] = useState('All')
  const projects = portfolioProjects.filter((project) => filter === 'All' || project.category === filter)

  return (
    <section className="section-shell py-20">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge>Capability Previews</Badge>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">Build Directions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`rounded-md border px-3 py-2 text-sm ${filter === item ? 'border-cyan-100 bg-cyan-300/15 text-white' : 'border-white/10 text-aura-muted'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <motion.div layout className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        <AnimatePresence>
          {projects.map((project, index) => (
            <motion.article
              layout
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-lg border border-white/10"
            >
              <img loading="lazy" alt={project.title} src={project.image} className={`w-full object-cover transition duration-500 group-hover:scale-105 ${index % 2 ? 'h-72' : 'h-96'}`} />
              <div className="absolute inset-0 flex translate-y-3 flex-col justify-end bg-gradient-to-t from-aura-dark via-aura-dark/65 to-transparent p-5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                <Badge className="w-fit">{project.category}</Badge>
                <h3 className="mt-3 text-xl font-bold">{project.title}</h3>
                <span className="mt-2 inline-flex items-center gap-2 font-bold text-cyan-100">
                  View Project
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
