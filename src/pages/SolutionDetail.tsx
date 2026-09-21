import { ArrowLeft, ArrowRight, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSuiteBlueprint } from '../data/suiteBlueprints'
import { defaultDraft } from '../domain/studio'
import { SuiteCanvas } from '../components/shared/SuiteCanvas'
import { SuiteCover } from '../components/shared/TemplateCover'
import { SEOHead } from '../components/shared/SEOHead'
import { ButtonLink } from '../components/ui/Button'
import { StatePanel } from '../components/ui/StatePanel'

export default function SolutionDetail() {
  const { slug } = useParams()
  const suite = getSuiteBlueprint(slug)
  const [mobile, setMobile] = useState(false)
  const [view, setView] = useState<'system' | 'website'>('system')
  const [section, setSection] = useState('Modules')
  if (!suite)
    return (
      <main className="section-shell py-20">
        <h1>Suite not found</h1>
        <StatePanel
          title="This suite is not available"
          action={<ButtonLink to="/solutions">All suites</ButtonLink>}
        />
      </main>
    )
  const draft = defaultDraft(
    suite.slug,
    suite.title,
    suite.modules.slice(0, 4).map((m) => m.title),
    [],
  )
  return (
    <main className="section-shell pb-20">
      <SEOHead
        title={suite.title}
        description={suite.summary}
        image={suite.image}
      />
      <header className="public-page-heading">
        <Link
          to="/solutions"
          className="inline-flex gap-2 items-center text-xs text-aura-muted mb-5"
        >
          <ArrowLeft size={13} />
          Business suites
        </Link>
        <h1>{suite.title}</h1>
        <p>{suite.summary}</p>
        <div className="page-actions mt-6">
          <ButtonLink to={`/studio?suite=${suite.slug}`}>
            Open in design studio
            <ArrowRight />
          </ButtonLink>
          <ButtonLink
            to={`/dashboard/requests/new?suite=${suite.slug}`}
            variant="secondary"
          >
            Discuss your requirements
          </ButtonLink>
        </div>
      </header>
      <div className="detail-grid">
        <section>
          <div className="mb-6">
            <SuiteCover suite={suite} />
          </div>
          <div className="studio-canvas-area rounded-md">
            <div className="studio-canvas-toolbar">
              <div className="studio-choice">
                <button
                  aria-pressed={view === 'system'}
                  onClick={() => setView('system')}
                >
                  System preview
                </button>
                <button
                  aria-pressed={view === 'website'}
                  onClick={() => setView('website')}
                >
                  Website preview
                </button>
              </div>
              <div className="device-controls">
                <button
                  className="icon-button"
                  aria-label="Desktop preview"
                  title="Desktop preview"
                  aria-pressed={!mobile}
                  onClick={() => setMobile(false)}
                >
                  <Monitor />
                </button>
                <button
                  className="icon-button"
                  aria-label="Mobile preview"
                  title="Mobile preview"
                  aria-pressed={mobile}
                  onClick={() => setMobile(true)}
                >
                  <Smartphone />
                </button>
              </div>
            </div>
            <div
              className="mx-auto"
              style={{ maxWidth: mobile ? 320 : '100%' }}
            >
              <SuiteCanvas draft={draft} website={view === 'website'} />
            </div>
            <p className="product-caption">
              Configurable prototype · Example content
            </p>
          </div>
          <div
            className="tab-bar mt-9"
            role="tablist"
            aria-label="Suite details"
          >
            {['Modules', 'Roles', 'Workflows'].map((item) => (
              <button
                role="tab"
                aria-selected={section === item}
                key={item}
                onClick={() => setSection(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="divide-y divide-[var(--line)]">
            {(section === 'Modules'
              ? suite.modules
              : section === 'Roles'
                ? suite.roles
                : suite.workflows
            ).map((item) => (
              <article key={item.id} className="py-5">
                <h2 className="text-base mb-3">{item.title}</h2>
                <p className="text-sm text-aura-muted leading-7">
                  {'summary' in item
                    ? item.summary
                    : 'trigger' in item
                      ? item.trigger
                      : ''}
                </p>
                {'steps' in item && (
                  <ol className="mt-4 pl-5 list-decimal text-xs text-aura-muted leading-7">
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </div>
        </section>
        <aside className="detail-meta">
          <h2 className="text-lg mb-5">Make it your own</h2>
          <p className="text-sm text-aura-muted leading-7">
            Set your brand, arrange pages, select modules, and attach the
            content our team needs to build your system.
          </p>
          <dl className="mt-7">
            <div>
              <dt>Audience</dt>
              <dd>{suite.audience}</dd>
            </div>
            <div>
              <dt>Available to configure</dt>
              <dd>
                {suite.modules.length} modules · {suite.roles.length} roles
              </dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>Hosted or custom build, scoped with AuraFlow</dd>
            </div>
            <div>
              <dt>What this preview includes</dt>
              <dd>
                Visual direction and sample content. Production workflows are
                agreed and built with your project.
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
