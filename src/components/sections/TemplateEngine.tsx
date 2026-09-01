import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { featuredTemplates } from '../../data/templates'
import { buildTemplatePreviewDocument } from '../../lib/templatePreview'
import { ButtonLink } from '../ui/Button'
import { Card } from '../ui/Card'

export function TemplateEngine() {
  const categories = featuredTemplates
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? '')
  const active = categories.find((template) => template.slug === activeSlug) ?? categories[0]
  const srcDoc = useMemo(() => buildTemplatePreviewDocument(active), [active])

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
        <Card className="mt-6 p-3 sm:p-5">
          <div className="overflow-hidden rounded-md border border-white/10 bg-black/30">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <iframe title={`${active.name} preview`} srcDoc={srcDoc} className="h-[36rem] w-full bg-aura-dark" />
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
