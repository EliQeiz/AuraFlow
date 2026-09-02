import { motion } from 'framer-motion'
import { BadgeDollarSign, Check, Eye, LayoutDashboard, Search, ServerCog, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { useAuth } from '../context/AuthContext'
import { industrySolutions, solutionCategories } from '../data/solutions'

export default function Solutions() {
  const { user } = useAuth()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const results = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return industrySolutions.filter((solution) => {
      const matchesCategory = category === 'All' || solution.category === category
      const haystack = `${solution.title} ${solution.summary} ${solution.audience} ${solution.modules.join(' ')}`.toLowerCase()
      return matchesCategory && (!normalized || haystack.includes(normalized))
    })
  }, [category, search])

  const studioBase = user ? '/dashboard/studio' : '/register'

  return (
    <PageWrapper>
      <SEOHead
        title="Hosted Business Systems"
        description="AuraFlow offers low-cost hosted software platforms and custom builds for schools, shops, restaurants, hotels, clinics, portfolios, and more."
      />
      <section className="section-shell grid gap-8 py-16 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <Badge>Hosted Systems</Badge>
          <h1 className="mt-5 max-w-5xl text-4xl font-extrabold sm:text-6xl">A full software studio for African businesses that need more than a website.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-aura-muted">
            Choose a school portal, shop system, restaurant ordering flow, hotel booking platform, clinic portal, portfolio, or a custom app. AuraFlow can host it affordably on a managed link, then customize the exact workflows and design inside the client app.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={studioBase}>
              <Sparkles className="h-4 w-4" />
              {user ? 'Open Prototype Studio' : 'Create Client Account'}
            </ButtonLink>
            <ButtonLink to="/pricing" variant="secondary">
              <BadgeDollarSign className="h-4 w-4" />
              View Pricing
            </ButtonLink>
          </div>
        </div>
        <Card className="p-5">
          <LayoutDashboard className="h-6 w-6 text-cyan-100" />
          <h2 className="mt-4 text-2xl font-bold">Managed platform model</h2>
          <p className="mt-3 leading-7 text-aura-muted">
            Clients can start with an AuraFlow-hosted platform like <span className="font-mono text-cyan-100">business.auraflow.app</span>, then upgrade later to their own domain or a deeper custom build.
          </p>
          <div className="mt-5 grid gap-2 text-sm text-aura-muted">
            {['Lower upfront cost', 'Configurable admin tools', 'Private client workspace', 'Upgrade path to custom ownership'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-100" />
                {item}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="border-y border-white/10 bg-aura-surface/55 py-10">
        <div className="section-shell grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school, restaurant, pharmacy, ecommerce..." className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {solutionCategories.map((item) => (
              <Button key={item} variant={category === item ? 'primary' : 'secondary'} className="shrink-0" onClick={() => setCategory(item)}>
                {item}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((solution, index) => (
            <motion.article key={solution.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
              <Card className="group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <img loading="lazy" src={solution.image} alt={solution.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-md border border-cyan-200/40 bg-aura-dark/80 px-3 py-1 text-xs font-bold text-cyan-100 backdrop-blur">
                    {solution.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-bold">{solution.title}</h2>
                    <Badge className="shrink-0">{solution.recommendedTier}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-3 leading-7 text-aura-muted">{solution.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {solution.modules.slice(0, 4).map((module) => (
                      <span key={module} className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-aura-muted">
                        {module}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-aura-muted">
                    <span className="inline-flex items-center gap-2 text-white">
                      <ServerCog className="h-4 w-4 text-cyan-100" />
                      {solution.startingPrice}
                    </span>
                    <span className="font-mono text-cyan-100">{solution.platformLabel}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <ButtonLink to={`/solutions/${solution.slug}`} variant="secondary" className="px-2">
                      <Eye className="h-4 w-4" />
                      View Suite
                    </ButtonLink>
                    <ButtonLink to={`${studioBase}${user ? `?solution=${solution.slug}` : ''}`} className="px-2">
                      <Sparkles className="h-4 w-4" />
                      Design
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            </motion.article>
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}
