import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  X,
} from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { StudioDraft } from '../../domain/studio'
import { fontFamilies } from '../../domain/composition'
import { IMAGES } from '../../lib/images'
import { getSuiteBlueprint } from '../../data/suiteBlueprints'

const examples = {
  school: {
    name: 'Adinkra Academy',
    section: 'Students',
    icon: GraduationCap,
    metrics: ['Students', 'Classes', 'Attendance'],
    values: ['248', '12', '96%'],
    columns: ['Student', 'Class', 'Status'],
    rows: [
      ['Ama Mensah', 'Primary 6', 'Enrolled'],
      ['Kwame Asante', 'Primary 5', 'Enrolled'],
      ['Zoe Williams', 'Primary 4', 'Application'],
      ['Akosua Boateng', 'Primary 6', 'Enrolled'],
    ],
    image: IMAGES.templates.school,
  },
  restaurant: {
    name: 'The Accra Table',
    section: 'Reservations',
    icon: UtensilsCrossed,
    metrics: ['Reservations', 'Tables', "Today's guests"],
    values: ['18', '8', '42'],
    columns: ['Guest', 'Time', 'Status'],
    rows: [
      ['Abena Owusu', '18:30 · 4 guests', 'Confirmed'],
      ['Daniel Okafor', '19:00 · 2 guests', 'Confirmed'],
      ['Michael Davis', '19:30 · 6 guests', 'Requested'],
      ['Esi Annan', '20:00 · 2 guests', 'Confirmed'],
    ],
    image: IMAGES.templates.restaurant,
  },
  hotel: {
    name: 'Akwaaba House',
    section: 'Reservations',
    icon: Building2,
    metrics: ['Reservations', 'Available rooms', 'Occupancy'],
    values: ['24', '6', '80%'],
    columns: ['Guest', 'Room', 'Status'],
    rows: [
      ['Akua Adjei', 'Garden suite', 'Checked in'],
      ['Kofi Osei', 'King room', 'Arriving'],
      ['Emma Clarke', 'Courtyard suite', 'Confirmed'],
      ['Nana Bonsu', 'Twin room', 'Checked in'],
    ],
    image: IMAGES.templates.hotel,
  },
  shop: {
    name: 'Form & Everyday',
    section: 'Orders',
    icon: ShoppingBag,
    metrics: ['Orders', 'Products', 'To fulfill'],
    values: ['32', '84', '8'],
    columns: ['Order', 'Customer', 'Status'],
    rows: [
      ['#AF-1028', 'Akosua Danso', 'Processing'],
      ['#AF-1027', 'Yaw Mensah', 'Fulfilled'],
      ['#AF-1026', 'Sarah Lewis', 'Fulfilled'],
      ['#AF-1025', 'Adwoa Opoku', 'Processing'],
    ],
    image: IMAGES.templates.ecommerce,
  },
}
export function SuiteCanvas({
  draft,
  page = 'Overview',
  website = false,
  bannerUrl,
  logoUrl,
  onPageChange,
}: {
  draft: Pick<
    StudioDraft,
    | 'suiteSlug'
    | 'name'
    | 'headline'
    | 'description'
    | 'primaryColor'
    | 'accentColor'
    | 'theme'
    | 'font'
    | 'pages'
    | 'modules'
  > &
    Pick<StudioDraft, 'visual'>
  page?: string
  website?: boolean
  bannerUrl?: string
  logoUrl?: string
  onPageChange?: (page: string) => void
}) {
  const key = draft.suiteSlug.includes('industrial')
    ? 'industrial'
    : draft.suiteSlug.includes('school')
      ? 'school'
      : draft.suiteSlug.includes('restaurant')
        ? 'restaurant'
        : draft.suiteSlug.includes('hotel')
          ? 'hotel'
          : draft.suiteSlug.includes('ecommerce')
            ? 'shop'
            : 'other'
  const suite = getSuiteBlueprint(draft.suiteSlug)
  const example =
    key === 'industrial'
      ? {
          name: 'Plant operations',
          section: 'Sensor registry',
          icon: LayoutDashboard,
          metrics: ['Silo fill', 'Throughput', 'Advisories'],
          values: ['68%', '124 t/h', '2'],
          columns: ['Sensor', 'Reading', 'Condition'],
          rows: [
            ['SILO-01 Level', '68%', 'Normal'],
            ['CV-02 Vibration', '2.4 mm/s', 'Review'],
            ['MOTOR-03 Temperature', '64 C', 'Normal'],
          ],
          image: '/template-previews/industrial-operations.png',
        }
      : key === 'other'
        ? {
            name: suite?.title || 'Your business',
            section: 'Selected modules',
            icon: LayoutDashboard,
            metrics: ['Pages', 'Modules', 'Preview'],
            values: [
              String(draft.pages.length),
              String(draft.modules.length),
              'Design',
            ],
            columns: ['Module', 'Scope', 'Status'],
            rows: draft.modules
              .slice(0, 6)
              .map((module) => [
                module,
                suite?.category || 'Business',
                'Selected',
              ]),
            image: suite?.image || IMAGES.services.webApps,
          }
        : examples[key]
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null)
  const Icon = example.icon
  const style = {
    '--canvas-primary': draft.primaryColor,
    '--canvas-accent': draft.accentColor,
    fontFamily: fontFamilies[draft.font],
    ...(draft.visual
      ? {
          '--canvas-bg': draft.visual.surface,
          '--canvas-soft': draft.visual.background,
          '--canvas-ink': draft.visual.ink,
          '--design-radius': `${draft.visual.radius}px`,
          '--design-spacing': `${draft.visual.spacing}px`,
          '--design-font-size': `${draft.visual.fontSize}px`,
        }
      : {}),
  } as CSSProperties
  const displayName = draft.name || example.name
  return (
    <div
      className={`suite-canvas ${draft.theme === 'dark' ? 'suite-canvas-dark' : ''}`}
      style={style}
    >
      <header className="suite-canvas-header">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="Business logo" />
          ) : (
            <Icon size={19} />
          )}
          <strong>{displayName}</strong>
        </div>
        <span>Prototype</span>
      </header>
      {website ? (
        <>
          <div className="canvas-site-nav">
            {draft.pages.map((item) => (
              <button
                type="button"
                key={item}
                className={item === page ? 'canvas-current-page' : ''}
                onClick={() => onPageChange?.(item)}
                disabled={!onPageChange}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="canvas-site-hero">
            <img
              src={bannerUrl || example.image}
              style={
                draft.visual
                  ? {
                      filter: `brightness(${draft.visual.brightness}%) saturate(${draft.visual.saturation}%)`,
                      opacity: draft.visual.imageOpacity,
                    }
                  : undefined
              }
              alt={
                key === 'school'
                  ? 'School campus'
                  : key === 'hotel'
                    ? 'Hotel grounds'
                    : key === 'restaurant'
                      ? 'Restaurant dining room'
                      : key === 'shop'
                        ? 'Shop experience'
                        : `${suite?.title || 'Business'} reference`
              }
            />
            <div>
              <small>{page === 'Overview' ? 'Home' : page}</small>
              <h2>{draft.headline || `Welcome to ${displayName}`}</h2>
              {draft.description && (
                <p className="canvas-site-description">{draft.description}</p>
              )}
              <span className="canvas-site-cta">
                {key === 'school'
                  ? 'Explore admissions'
                  : key === 'hotel'
                    ? 'Discover our rooms'
                    : key === 'restaurant'
                      ? 'A seat at our table'
                      : key === 'shop'
                        ? 'Explore the collection'
                        : 'Explore our services'}{' '}
                <ArrowUpRight size={13} />
              </span>
            </div>
          </div>
          <div className="canvas-site-sections">
            {draft.modules.slice(0, 3).map((module) => (
              <article key={module}>
                <h3>{module}</h3>
                <p>
                  {suite?.modules.find((item) => item.title === module)
                    ?.summary || module}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="canvas-dashboard">
          <div className="canvas-page-title">
            <div>
              <small>{displayName} / Workspace</small>
              <h2>{page === 'Overview' ? 'Overview' : page}</h2>
            </div>
            <CalendarDays size={16} />
          </div>
          <div className="canvas-metrics">
            {example.metrics.map((label, index) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{example.values[index]}</strong>
                <div className="canvas-sparkline">
                  {[25, 45, 34, 65, 52, 75, 63, 85, 70, 95].map((height, i) => (
                    <i key={i} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="canvas-table-heading">
            <h3>{page === 'Overview' ? example.section : page}</h3>
            <label className="canvas-search">
              <Search size={12} />
              <input
                aria-label="Search preview records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
            </label>
          </div>
          <div className="canvas-table-scroll">
            <table>
              <thead>
                <tr>
                  {example.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {example.rows
                  .filter((row) =>
                    row.join(' ').toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((row, index) => (
                    <tr key={index}>
                      {row.map((value, i) => (
                        <td key={i}>
                          {i === 0 ? (
                            <span className="canvas-record-name">
                              <span>{value.slice(0, 1)}</span>
                              {value}
                            </span>
                          ) : i === 2 ? (
                            <span className="canvas-status">{value}</span>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          type="button"
                          className="canvas-record-open"
                          onClick={() => setSelectedRow(row)}
                          aria-label={`Preview ${row[0]}`}
                        >
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {selectedRow && (
            <div
              className="canvas-record-detail"
              role="region"
              aria-label="Preview record details"
            >
              <button
                type="button"
                className="canvas-record-open"
                onClick={() => setSelectedRow(null)}
                aria-label="Close preview details"
              >
                <X size={14} />
              </button>
              <h3>{selectedRow[0]}</h3>
              <dl>
                {example.columns.map((label, index) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{selectedRow[index]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="canvas-demo-label">
            <LayoutDashboard size={11} />
            Example content · Your design preview
          </div>
        </div>
      )}
    </div>
  )
}
