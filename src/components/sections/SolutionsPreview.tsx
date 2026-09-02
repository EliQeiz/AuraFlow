import { ArrowRight, Eye, ServerCog, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { industrySolutions } from '../../data/solutions'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'
import { ButtonLink } from '../ui/Button'
import { Card } from '../ui/Card'

const featured = industrySolutions.slice(0, 6)

export function SolutionsPreview() {
  const { user } = useAuth()

  return (
    <section className="section-shell py-20">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-4xl">
          <Badge>Software Platforms</Badge>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">Low-cost hosted systems, custom apps, and prototypes from one AuraFlow workspace.</h2>
          <p className="mt-4 text-lg leading-8 text-aura-muted">
            Schools, shops, restaurants, hotels, pharmacies, portfolios, and service firms can start with a managed platform link, then evolve into custom software when the business is ready.
          </p>
        </div>
        <ButtonLink to="/solutions" variant="secondary" className="w-fit">
          Explore Solutions
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featured.map((solution, index) => (
          <motion.div key={solution.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
            <Card className="group h-full overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img loading="lazy" src={solution.image} alt={solution.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <ServerCog className="h-5 w-5 text-cyan-100" />
                <h3 className="mt-4 text-2xl font-bold">{solution.title}</h3>
                <p className="mt-2 line-clamp-2 text-aura-muted">{solution.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {solution.modules.slice(0, 3).map((module) => (
                    <Badge key={module} className="bg-white/[0.07] text-white">{module}</Badge>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <ButtonLink to={`/solutions/${solution.slug}`} variant="secondary" className="px-2">
                    <Eye className="h-4 w-4" />
                    View
                  </ButtonLink>
                  <ButtonLink to={user ? `/dashboard/studio?solution=${solution.slug}` : '/register'} className="px-2">
                    <Sparkles className="h-4 w-4" />
                    Design
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
