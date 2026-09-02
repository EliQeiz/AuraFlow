import { AnimatePresence, motion } from 'framer-motion'
import { Eye, LogIn, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { useAuth } from '../context/AuthContext'
import { colorOptions, pageOptions, priceOptions, styleOptions, useTemplates } from '../hooks/useTemplates'
import { formatPrice } from '../lib/utils'
import { marketplaceCategories } from '../data/templates'
import type { Template } from '../types'

export default function Templates() {
  const filters = useTemplates()
  const { user } = useAuth()

  return (
    <PageWrapper>
      <SEOHead title="Templates" description="Browse 55 AuraFlow template launches across restaurants, clinics, retail, SaaS, portfolios, logistics, and more." />
      <section className="section-shell pb-10 pt-16">
        <Badge>Marketplace</Badge>
        <h1 className="mt-5 text-4xl font-extrabold sm:text-6xl">Premium templates with room to become your product.</h1>
        <p className="mt-4 max-w-3xl text-lg text-aura-muted">Filter public examples by industry, mood, page depth, and tier. Selection, uploads, and customization requests stay inside the private client app.</p>
      </section>

      <section className="section-shell grid gap-5 pb-20 lg:grid-cols-[280px_1fr]">
        <aside className="glass h-fit rounded-lg p-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-aura-muted" />
            <Input value={filters.search} onChange={(event) => filters.setSearch(event.target.value)} placeholder="Search templates" className="pl-9" />
          </div>
          <FilterTitle title="Category" />
          <div className="grid gap-2">
            {marketplaceCategories.map((category) => (
              <label key={category} className="flex cursor-pointer items-start gap-2 text-sm text-aura-muted">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => filters.toggleCategory(category)}
                  className="mt-0.5 h-4 w-4 rounded accent-cyan-300"
                />
                {category}
              </label>
            ))}
          </div>
          <FilterTitle title="Style" />
          <RadioGroup value={filters.style} values={styleOptions} onChange={filters.setStyle} />
          <FilterTitle title="Color Scheme" />
          <RadioGroup value={filters.colorScheme} values={colorOptions} onChange={filters.setColorScheme} />
          <FilterTitle title="Pages Included" />
          <RadioGroup value={filters.pages} values={pageOptions} onChange={filters.setPages} />
          <FilterTitle title="Price Range" />
          <RadioGroup value={filters.tier} values={priceOptions} onChange={filters.setTier} labels={{ free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }} />
          <label className="mt-4 grid gap-2 text-sm text-aura-muted">
            Max price: <strong className="text-white">${filters.maxPrice}</strong>
            <input type="range" min={0} max={99} step={10} value={filters.maxPrice} onChange={(event) => filters.setMaxPrice(Number(event.target.value))} className="accent-cyan-300" />
          </label>
          <button onClick={filters.reset} className="mt-5 text-sm font-bold text-cyan-100">
            Reset filters
          </button>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-aura-muted">
              <strong className="font-orbitron text-white">{filters.results.length}</strong> templates ready
            </p>
          </div>
          <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filters.results.map((template) => (
                <TemplateCard key={template.id} template={template} signedIn={Boolean(user)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  )
}

function TemplateCard({ signedIn, template }: { signedIn: boolean; template: Template }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} whileHover={{ y: -12 }}>
      <Card className="group h-full overflow-hidden">
        <Link to={`/templates/${template.slug}`}>
          <div className="relative aspect-video overflow-hidden">
            <img loading="lazy" src={template.previewImage} alt={template.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <span className="absolute bottom-3 left-3 translate-y-12 rounded-md bg-aura-dark/90 px-3 py-2 text-sm font-bold text-white transition group-hover:translate-y-0">
              Preview
            </span>
          </div>
        </Link>
        <div className="grid gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{template.category}</Badge>
            <Badge className="bg-white/[0.07] text-white">{template.style}</Badge>
          </div>
          <div>
            <h2 className="text-xl font-bold">{template.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-aura-muted">{template.description}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-aura-muted">
            <span>Pages: {template.pages.length}</span>
            <span>Firebase: yes</span>
          </div>
          <strong className="font-orbitron text-xl text-white">{formatPrice(template.price)}</strong>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink to={`/templates/${template.slug}`} variant="secondary" className="px-2">
              <Eye className="h-4 w-4" />
              Preview
            </ButtonLink>
            <ButtonLink to={signedIn ? `/dashboard/requests/new?template=${template.slug}` : '/register'} className="px-2">
              <LogIn className="h-4 w-4" />
              {signedIn ? 'Use' : 'Client App'}
            </ButtonLink>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function FilterTitle({ title }: { title: string }) {
  return <h2 className="mb-3 mt-6 font-syne text-sm font-bold uppercase text-white">{title}</h2>
}

function RadioGroup({
  labels,
  onChange,
  value,
  values,
}: {
  labels?: Record<string, string>
  onChange: (value: string) => void
  value: string
  values: string[]
}) {
  return (
    <div className="grid gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-aura-muted">
        <input type="radio" checked={!value} onChange={() => onChange('')} className="accent-cyan-300" />
        All
      </label>
      {values.map((item) => (
        <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-aura-muted">
          <input type="radio" checked={value === item} onChange={() => onChange(item)} className="accent-cyan-300" />
          {labels?.[item] ?? item}
        </label>
      ))}
    </div>
  )
}
