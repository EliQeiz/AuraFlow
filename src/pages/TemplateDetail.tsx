import {
  ArrowLeft,
  ArrowRight,
  Check,
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SEOHead } from '../components/shared/SEOHead'
import { buildTemplatePreviewDocument } from '../lib/templatePreview'
import { templates } from '../data/templates'
import { StatePanel } from '../components/ui/StatePanel'
const devices = [
  { name: 'Desktop', width: '100%', Icon: Monitor },
  { name: 'Tablet', width: '640px', Icon: Tablet },
  { name: 'Mobile', width: '360px', Icon: Smartphone },
]
export default function TemplateDetail() {
  const { slug } = useParams()
  const template = templates.find((item) => item.slug === slug)
  const [device, setDevice] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const preview = useMemo(
    () =>
      template
        ? buildTemplatePreviewDocument(template, window.location.origin)
        : '',
    [template],
  )
  if (!template)
    return (
      <main className="section-shell py-20">
        <h1>Template not found</h1>
        <StatePanel
          title="That template is unavailable"
          action={<ButtonLink to="/templates">Back to the library</ButtonLink>}
        />
      </main>
    )
  const frame = (
    <iframe
      title={`${template.name} interactive preview`}
      srcDoc={preview}
      sandbox="allow-forms allow-top-navigation-by-user-activation"
      referrerPolicy="no-referrer"
      className="w-full h-[650px] bg-white border-0"
    />
  )
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title={template.name}
        description={template.description}
        image={template.previewImage}
      />
      <header className="public-page-heading">
        <Link
          className="inline-flex items-center gap-2 text-xs text-aura-muted mb-4"
          to="/templates"
        >
          <ArrowLeft size={14} />
          Template library
        </Link>
        <h1>{template.name}</h1>
        <p>{template.description}</p>
      </header>
      <div className="detail-grid">
        <section>
          <div className="studio-canvas-toolbar">
            <div className="device-controls">
              {devices.map(({ name, Icon }, index) => (
                <button
                  key={name}
                  className="icon-button"
                  title={`${name} preview`}
                  aria-label={`${name} preview`}
                  aria-pressed={device === index}
                  onClick={() => setDevice(index)}
                >
                  <Icon />
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setExpanded(true)}>
              <Maximize2 />
              Expand preview
            </Button>
          </div>
          <div className="border border-[var(--line)] rounded-md p-2 bg-[var(--subtle)]">
            <div
              className="mx-auto overflow-hidden rounded-sm"
              style={{ maxWidth: devices[device].width }}
            >
              {frame}
            </div>
          </div>
          <p className="product-caption">
            Template concept · Bookings and requests continue in your AuraFlow
            workspace
          </p>
          <h2 className="text-xl mt-8 mb-5">Planned features</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {template.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-aura-muted"
              >
                <Check size={15} className="mt-1 text-[var(--positive)]" />
                {feature}
              </li>
            ))}
          </ul>
          <h2 className="text-xl mt-10 mb-5">Design imagery</h2>
          <div className="grid gap-4 grid-cols-2">
            {[...new Set(template.screenshots)]
              .slice(0, 4)
              .map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`${template.name} visual reference ${index + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-md object-cover"
                />
              ))}
          </div>
        </section>
        <aside className="detail-meta">
          <h2 className="text-xl">{template.name}</h2>
          <p className="text-sm text-aura-muted mt-4 leading-7">
            {template.longDescription}
          </p>
          <div className="mt-7 mb-7">
            <span className="text-xs text-aura-muted">
              Template starting price
            </span>
            <strong className="block text-3xl font-medium mt-2">
              {template.price ? `$${template.price}` : 'Free'}
            </strong>
            <p className="text-xs text-aura-muted mt-2">
              Customization and hosting scoped separately.
            </p>
          </div>
          <ButtonLink
            to={`/dashboard/requests/new?template=${template.slug}`}
            className="w-full"
          >
            Use this template
            <ArrowRight />
          </ButtonLink>
          <h3 className="text-sm mt-8 mb-4">Included pages</h3>
          <ul className="grid gap-3">
            {template.pages.map((page) => (
              <li
                key={page}
                className="flex gap-2 items-center text-xs text-aura-muted"
              >
                <Check size={13} />
                {page}
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <Modal
        open={expanded}
        onOpenChange={setExpanded}
        title={template.name}
        description="Explore the template concept."
        className="max-w-[95vw]"
      >
        {expanded && frame}
      </Modal>
    </main>
  )
}
