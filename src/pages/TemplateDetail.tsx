import { Check, LockKeyhole, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, Link, useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { buildTemplatePreviewDocument } from '../lib/templatePreview'
import { formatPrice } from '../lib/utils'
import { templates } from '../data/templates'

const devices = {
  Desktop: { icon: Monitor, className: 'mx-auto w-full max-w-5xl aspect-[16/9]' },
  Tablet: { icon: Tablet, className: 'mx-auto w-full max-w-2xl aspect-[4/3]' },
  Mobile: { icon: Smartphone, className: 'mx-auto w-full max-w-sm aspect-[9/16]' },
}

export default function TemplateDetail() {
  const { slug } = useParams()
  const template = templates.find((item) => item.slug === slug)
  const [device, setDevice] = useState<keyof typeof devices>('Desktop')
  const [previewOpen, setPreviewOpen] = useState(false)
  const preview = useMemo(() => template && buildTemplatePreviewDocument(template), [template])

  if (!template) return <Navigate to="/templates" replace />

  const similar = templates.filter((item) => item.category === template.category && item.id !== template.id).slice(0, 3)
  const FrameIcon = devices[device].icon

  return (
    <PageWrapper>
      <SEOHead title={template.name} description={template.longDescription} image={template.previewImage} />
      <section className="relative min-h-[60vh] overflow-hidden">
        <img src={template.previewImage} alt={template.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-aura-dark via-aura-dark/80 to-aura-dark/40" />
        <div className="section-shell relative flex min-h-[60vh] flex-col justify-end py-12">
          <Badge className="w-fit">{template.category}</Badge>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold sm:text-6xl">{template.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-100/85">{template.longDescription}</p>
        </div>
      </section>

      <section className="section-shell grid gap-6 py-16 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-10">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {Object.entries(devices).map(([label, config]) => {
                const Icon = config.icon
                return (
                  <Button key={label} variant={device === label ? 'primary' : 'secondary'} onClick={() => setDevice(label as keyof typeof devices)}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                )
              })}
              <Button onClick={() => setPreviewOpen(true)} variant="secondary">
                Live Preview
              </Button>
            </div>
            <Card className="p-3 sm:p-5">
              <div className={`${devices[device].className} overflow-hidden rounded-lg border-[10px] border-black bg-black shadow-2xl`}>
                <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-aura-surface py-2 text-xs text-aura-muted">
                  <FrameIcon className="h-3.5 w-3.5" />
                  {device} frame
                </div>
                <iframe title={`${template.name} ${device} preview`} srcDoc={preview} className="h-[calc(100%-2rem)] w-full bg-aura-dark" />
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-3xl font-bold">Included Features</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {template.features.map((feature, index) => (
                <Card key={feature} className="flex items-start gap-3 p-4" tilt={index % 2 === 0}>
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <span className="text-aura-muted">{feature}</span>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold">Screenshots</h2>
            <Swiper className="mt-5" spaceBetween={16} slidesPerView={1.05} breakpoints={{ 768: { slidesPerView: 1.6 } }}>
              {template.screenshots.map((screenshot) => (
                <SwiperSlide key={screenshot}>
                  <img loading="lazy" alt={`${template.name} screenshot`} src={screenshot} className="h-[28rem] w-full rounded-lg border border-white/10 object-cover" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        <aside className="glass h-fit rounded-lg p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="mt-2 text-aura-muted">Public preview. Choose a starting point and attach project files in the private client app.</p>
          <div className="mt-5">
            <h3 className="font-bold text-white">Included pages</h3>
            <ul className="mt-3 grid gap-2 text-sm text-aura-muted">
              {template.pages.map((page) => (
                <li key={page} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-100" />
                  {page}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {template.techStack.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
          <div className="mt-5">
            <h3 className="font-bold text-white">Color scheme</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-7 w-7 rounded-md bg-aura-violet" />
              <span className="h-7 w-7 rounded-md bg-aura-cyan" />
              <span className="h-7 w-7 rounded-md bg-white" />
              <Badge>{template.colorScheme}</Badge>
            </div>
          </div>
          <strong className="mt-6 block font-orbitron text-3xl text-white">{formatPrice(template.price)}</strong>
          <div className="mt-4 grid gap-2">
            <ButtonLink to="/register" className="w-full">
              <LockKeyhole className="h-4 w-4" />
              Use In Client App - {formatPrice(template.price)}
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary" className="w-full">
              Existing Client Login
            </ButtonLink>
          </div>
        </aside>
      </section>

      <section className="section-shell pb-20">
        <h2 className="text-3xl font-bold">Similar Templates</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {similar.map((item, index) => (
            <Card key={item.id} className="overflow-hidden" tilt={index === 1}>
              <Link to={`/templates/${item.slug}`}>
                <img loading="lazy" src={item.previewImage} alt={item.name} className="aspect-video w-full object-cover" />
                <div className="p-4">
                  <Badge>{item.category}</Badge>
                  <h3 className="mt-3 text-xl font-bold">{item.name}</h3>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <Modal open={previewOpen} onOpenChange={setPreviewOpen} title={`${template.name} preview`} className="h-[94vh] w-[96vw] max-w-none">
        <iframe title={`${template.name} fullscreen preview`} srcDoc={preview} className="h-[calc(94vh-6rem)] w-full rounded-lg bg-aura-dark" />
      </Modal>
    </PageWrapper>
  )
}
