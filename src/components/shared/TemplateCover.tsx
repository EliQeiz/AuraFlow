import { ArrowUpRight, Menu } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MotionMedia } from './MotionMedia'
import { SuiteCanvas } from './SuiteCanvas'
import { defaultDraft } from '../../domain/studio'
import type { SuiteBlueprint, Template } from '../../types'

const headlines: Record<string, string> = {
  Cafe: 'Good coffee. Better company.',
  'Fast Food': 'Your favourites. Fresh and ready.',
  'Food Delivery': 'Good food, at your door.',
  Dental: 'A little more confidence.',
  Pediatric: 'Growing up, in good hands.',
  Electronics: 'Meet your next upgrade.',
  Grocery: 'Fresh for your everyday.',
  Jewelry: 'Small details. Lasting meaning.',
  Resort: 'Stay a little longer.',
  Restaurant: 'A place at our table.',
  Clinic: 'Care, closer to you.',
  Hospital: 'Better care. Every day.',
  Hotel: 'Somewhere to stay. A place to belong.',
  'E-commerce': 'Find your everyday favourite.',
  School: 'A bright beginning.',
  'Law Firm': 'Clarity. Confidence. Counsel.',
  'Real Estate': 'Find a place to call yours.',
  Salon: 'Your next chapter.',
  Bakery: 'Made slowly. Enjoyed daily.',
  Portfolio: 'Selected work. New perspectives.',
  'Tech Startup': 'Your work, connected.',
  Gym: 'Show up for yourself.',
  Travel: 'Go a little further.',
}
export function TemplateCover({
  template,
  autoplay = false,
}: {
  template: Template
  autoplay?: boolean
}) {
  const software = template.category === 'Tech Startup'
  if (software)
    return (
      <div className="template-cover software-cover">
        <div className="cover-browser">
          <span />
          <span />
          <span />
          <small>{template.name}</small>
        </div>
        <CanvasThumbnail>
          <SuiteCanvas
            draft={defaultDraft(
              'ecommerce-storefront',
              template.subcategory === 'SaaS Product'
                ? 'Flow workspace'
                : 'Pocket commerce',
              ['Orders', 'Customers', 'Analytics'],
              [],
            )}
          />
        </CanvasThumbnail>
      </div>
    )
  const style = [
    'Hotel',
    'Restaurant',
    'Bakery',
    'Law Firm',
    'Architecture',
    'Interior Design',
  ].includes(template.category)
    ? 'editorial'
    : 'modern'
  const headline =
    headlines[template.subcategory] ||
    headlines[template.category] ||
    template.subcategory
  return (
    <div className={`template-cover cover-${style}`}>
      <div className="cover-browser">
        <span />
        <span />
        <span />
        <small>
          {template.subcategory.toLowerCase().replaceAll(' ', '')}.example
        </small>
      </div>
      <MotionMedia
        images={[template.previewImage, ...template.screenshots]}
        alt={template.name}
        autoplay={autoplay}
      >
        <div className="cover-content">
          <div className="cover-nav">
            <strong>{template.subcategory}</strong>
            <span>About&nbsp; / &nbsp;Discover</span>
            <Menu size={12} />
          </div>
          <div className="cover-headline">
            <span>{template.category}</span>
            <strong>{headline}</strong>
            <span className="cover-link">
              Explore <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </MotionMedia>
      <div className="cover-bottom">
        <span>{template.style}</span>
        <span>{template.pages.length} pages</span>
      </div>
    </div>
  )
}
export function SuiteCover({ suite }: { suite: SuiteBlueprint }) {
  const draft = defaultDraft(
    suite.slug,
    suite.title,
    suite.modules.slice(0, 3).map((item) => item.title),
    [],
  )
  return (
    <div
      className="template-cover software-cover"
      aria-label={`${suite.title} software preview`}
    >
      <div className="cover-browser">
        <span />
        <span />
        <span />
        <small>{suite.category} workspace</small>
      </div>
      <CanvasThumbnail>
        <SuiteCanvas draft={draft} />
      </CanvasThumbnail>
    </div>
  )
}

function CanvasThumbnail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / 600),
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="software-cover-window" ref={ref} inert>
      <div
        className="canvas-thumbnail-content"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
