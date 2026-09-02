import { ArrowRight, Eye, LayoutTemplate, LockKeyhole, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { featuredTemplates } from '../../data/templates'
import { buildTemplatePreviewDocument } from '../../lib/templatePreview'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'
import { ButtonLink } from '../ui/Button'
import { Card } from '../ui/Card'

export function TemplateEngine() {
  const { user } = useAuth()
  const categories = featuredTemplates
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? '')
  const active = categories.find((template) => template.slug === activeSlug) ?? categories[0]
  const srcDoc = useMemo(() => buildTemplatePreviewDocument(active), [active])
  const useLink = user ? `/dashboard/requests/new?template=${active.slug}` : '/register'

  return (
    <section className="border-y border-white/10 bg-aura-surface/55 py-20">
      <div className="section-shell">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-extrabold sm:text-5xl">Templates grounded in Ghanaian and African business contexts.</h2>
          <p className="mt-4 text-lg text-aura-muted">Switch industries to preview food, hospitality, service, retail, and product directions that can be localized in the client app.</p>
        </div>
        <div className="mt-7">
          <Swiper spaceBetween={12} slidesPerView={1.4} breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 5 } }}>
            {categories.map((template) => (
              <SwiperSlide key={template.slug}>
                <button
                  onClick={() => setActiveSlug(template.slug)}
                  className={`w-full rounded-lg border px-3 py-4 text-left font-bold transition ${
                    active.slug === template.slug ? 'border-cyan-100 bg-cyan-300/15 text-white' : 'border-white/10 bg-white/[0.06] text-aura-muted'
                  }`}
                >
                  {template.category}
                  <span className="mt-1 block text-xs font-normal">{template.subcategory}</span>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <Card className="mt-6 overflow-hidden p-0">
          <div className="grid lg:grid-cols-[0.38fr_1fr]">
            <aside className="border-b border-white/10 bg-black/25 p-5 lg:border-b-0 lg:border-r">
              <Badge>{active.category}</Badge>
              <h3 className="mt-4 text-3xl font-extrabold">{active.name}</h3>
              <p className="mt-3 leading-7 text-aura-muted">{active.longDescription}</p>
              <div className="mt-5 grid gap-3">
                <PreviewList title="Included pages" items={active.pages.slice(0, 5)} />
                <PreviewList title="Built-in functions" items={active.features.slice(0, 5)} />
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <ButtonLink to={`/templates/${active.slug}`} variant="secondary">
                  <Eye className="h-4 w-4" />
                  Full Preview
                </ButtonLink>
                <ButtonLink to={useLink}>
                  {user ? <Sparkles className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  {user ? 'Use This Template' : 'Login To Use'}
                </ButtonLink>
              </div>
            </aside>
            <div className="overflow-hidden bg-black/30 p-3 sm:p-5">
              <div className="overflow-hidden rounded-md border border-white/10">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="inline-flex items-center gap-2 truncate font-mono text-xs text-cyan-100">
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    AuraFlow live concept preview
                  </span>
                </div>
                <iframe title={`${active.name} preview`} srcDoc={srcDoc} className="h-[36rem] w-full bg-aura-dark" />
              </div>
            </div>
          </div>
        </Card>
        <div className="mt-7">
          <ButtonLink to="/templates">
            Explore All 50+ Templates
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function PreviewList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <span className="text-sm font-bold text-white">{title}</span>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-cyan-200/20 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-50">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
