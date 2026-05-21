import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { portfolioProjects } from '../data/portfolio'
import type { PortfolioProject } from '../types'

const filters = ['All', 'Websites', 'Mobile Apps', 'Dashboards', 'Templates']

export default function Portfolio() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<PortfolioProject | null>(null)
  const projects = portfolioProjects.filter((project) => filter === 'All' || project.category === filter)

  return (
    <PageWrapper>
      <SEOHead title="Portfolio" description="AuraFlow websites, product apps, dashboards, and template adaptations." />
      <section className="section-shell py-16">
        <Badge>Work</Badge>
        <h1 className="mt-5 max-w-4xl text-4xl font-extrabold sm:text-6xl">Selected builds shaped for action.</h1>
        <div className="mt-7 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item} variant={item === filter ? 'primary' : 'secondary'} onClick={() => setFilter(item)}>
              {item}
            </Button>
          ))}
        </div>
      </section>

      <motion.section layout className="section-shell columns-1 gap-4 pb-20 md:columns-2 xl:columns-3">
        <AnimatePresence>
          {projects.map((project, index) => (
            <motion.button
              layout
              layoutId={project.id}
              key={project.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={() => setSelected(project)}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg border border-white/10 text-left"
            >
              <img src={project.image} alt={project.title} className={`w-full object-cover transition duration-500 group-hover:scale-105 ${index % 2 ? 'h-80' : 'h-[28rem]'}`} />
              <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-aura-dark via-aura-dark/55 to-transparent p-5">
                <Badge className="w-fit">{project.category}</Badge>
                <strong className="mt-3 font-syne text-2xl text-white">{project.title}</strong>
                <span className="mt-2 text-sm font-bold text-cyan-100">View Details</span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.section>

      <Modal open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title} description={selected?.summary}>
        {selected ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="grid gap-4">
              {selected.screenshots.map((screenshot) => (
                <img key={screenshot} src={screenshot} alt={selected.title} className="h-72 w-full rounded-lg border border-white/10 object-cover" />
              ))}
            </div>
            <aside className="rounded-lg border border-white/10 bg-black/20 p-5">
              <Badge>{selected.category}</Badge>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.techStack.map((tech) => (
                  <Badge key={tech} className="bg-white/[0.07] text-white">
                    {tech}
                  </Badge>
                ))}
              </div>
              <blockquote className="mt-5 leading-7 text-aura-muted">“{selected.testimonial}”</blockquote>
              <a href={selected.liveUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-100">
                Live site
                <ExternalLink className="h-4 w-4" />
              </a>
            </aside>
          </div>
        ) : null}
      </Modal>
    </PageWrapper>
  )
}
