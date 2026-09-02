import { motion } from 'framer-motion'
import { ArrowLeft, Check, DatabaseZap, LockKeyhole, ShieldCheck, Sparkles, UsersRound, Waypoints } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { SuitePreviewPanel } from '../components/shared/SuitePreviewPanel'
import { PageWrapper } from '../components/shared/PageWrapper'
import { SEOHead } from '../components/shared/SEOHead'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { getSuiteBlueprint, suiteBlueprints } from '../data/suiteBlueprints'

export default function SolutionDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const suite = getSuiteBlueprint(slug)
  const related = suiteBlueprints.filter((item) => item.slug !== slug).slice(0, 3)

  if (!suite) {
    return (
      <PageWrapper>
        <section className="section-shell grid min-h-[70vh] place-items-center py-20 text-center">
          <div>
            <Badge>Suite Not Found</Badge>
            <h1 className="mt-4 text-4xl font-extrabold">That AuraFlow suite does not exist yet.</h1>
            <ButtonLink to="/solutions" className="mt-6">
              <ArrowLeft className="h-4 w-4" />
              Back To Solutions
            </ButtonLink>
          </div>
        </section>
      </PageWrapper>
    )
  }

  const studioLink = user ? `/dashboard/studio?suite=${suite.slug}` : '/register'
  const requestLink = user ? `/dashboard/requests/new?solution=${suite.slug}` : '/register'

  return (
    <PageWrapper>
      <SEOHead title={suite.title} description={suite.longDescription} image={suite.image} />
      <section className="relative min-h-[78vh] overflow-hidden">
        <img src={suite.image} alt={suite.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-aura-dark via-aura-dark/82 to-aura-dark/28" />
        <div className="section-shell relative flex min-h-[78vh] flex-col justify-end py-14">
          <Link to="/solutions" className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-cyan-100">
            <ArrowLeft className="h-4 w-4" />
            Solutions
          </Link>
          <Badge className="w-fit">{suite.category}</Badge>
          <h1 className="mt-5 max-w-5xl text-5xl font-extrabold sm:text-7xl">{suite.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-aura-muted">{suite.longDescription}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={studioLink}>
              <Sparkles className="h-4 w-4" />
              {user ? 'Open In Studio' : 'Create Account To Design'}
            </ButtonLink>
            <ButtonLink to={requestLink} variant="secondary">
              <LockKeyhole className="h-4 w-4" />
              {user ? 'Start Private Request' : 'Login Required For Requests'}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-4 py-16 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={DatabaseZap} label="Data model" value={`${suite.dataEntities.length}+ entities`} />
        <Stat icon={UsersRound} label="Role portals" value={`${suite.roles.length}`} />
        <Stat icon={Waypoints} label="Workflows" value={`${suite.workflows.length}`} />
        <Stat icon={ShieldCheck} label="Security" value="Owner/admin private" />
      </section>

      <section className="section-shell pb-16">
        <SuitePreviewPanel suite={suite} />
      </section>

      <section className="section-shell pb-16">
        <div className="mb-6 max-w-3xl">
          <Badge>Prototype Tools</Badge>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">Design the system before AuraFlow builds it.</h2>
          <p className="mt-4 leading-8 text-aura-muted">
            Inside the client portal, each suite becomes a guided builder where clients choose screens, uploads, brand direction, automations, data, payments, and admin controls.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suite.builderFeatures.map((feature, index) => (
            <motion.article
              key={feature.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.025 }}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
            >
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-aura-muted">{feature.summary}</p>
              <p className="mt-3 rounded-md border border-cyan-200/20 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-50">{feature.output}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-aura-surface/55 py-16">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.72fr_1fr]">
          <div>
            <Badge>Configurable Modules</Badge>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">A complete suite without forcing every client into the same shape.</h2>
            <p className="mt-4 leading-8 text-aura-muted">
              A school, shop, clinic, hotel, or restaurant can start lean and only activate the modules that match its real operation. AuraFlow can then add deeper custom logic after the first launch proves the workflow.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {suite.modules.map((module, index) => (
              <motion.article
                key={module.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.025 }}
                className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
              >
                <Badge className="bg-white/[0.07] text-white">{module.category}</Badge>
                <h3 className="mt-3 text-xl font-bold">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-aura-muted">{module.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {module.actions.slice(0, 2).map((action) => (
                    <span key={action} className="inline-flex items-center gap-1 rounded-md border border-cyan-200/20 px-2 py-1 text-xs text-cyan-100">
                      <Check className="h-3 w-3" />
                      {action}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell grid gap-6 py-16 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><UsersRound className="h-5 w-5 text-cyan-100" /> Role portals</h2>
          <div className="mt-4 grid gap-3">
            {suite.roles.map((role) => (
              <div key={role.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-white">{role.title}</strong>
                  <span className="font-mono text-xs text-cyan-100">{role.portal}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-aura-muted">{role.summary}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Waypoints className="h-5 w-5 text-cyan-100" /> Business workflows</h2>
          <div className="mt-4 grid gap-3">
            {suite.workflows.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <strong className="text-white">{item.title}</strong>
                <p className="mt-1 text-sm text-cyan-100">{item.trigger}</p>
                <p className="mt-2 text-sm leading-6 text-aura-muted">{item.steps.join(' -> ')}</p>
                <p className="mt-3 rounded-md border border-white/10 bg-white/[0.05] p-3 text-sm text-aura-muted">{item.output}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="border-y border-white/10 bg-aura-surface/55 py-16">
        <div className="section-shell grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <Card className="p-5">
            <ShieldCheck className="h-6 w-6 text-cyan-100" />
            <h2 className="mt-4 text-3xl font-extrabold">Security boundary</h2>
            <p className="mt-3 leading-7 text-aura-muted">The public site shows the offer. Private briefs, uploads, previews, chats, and admin controls stay behind authenticated accounts and Firebase security rules.</p>
            {suite.sourceNote ? <p className="mt-4 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">{suite.sourceNote}</p> : null}
          </Card>
          <div className="grid gap-3">
            {suite.securityControls.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-aura-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge>More Systems</Badge>
            <h2 className="mt-4 text-3xl font-extrabold">Other AuraFlow suite starts</h2>
          </div>
          <ButtonLink to={studioLink} className="w-fit">
            Design This Suite
            <Sparkles className="h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <img src={item.image} alt={item.title} className="aspect-video w-full object-cover" loading="lazy" />
              <div className="p-4">
                <Badge>{item.category}</Badge>
                <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-aura-muted">{item.summary}</p>
                <ButtonLink to={`/solutions/${item.slug}`} variant="secondary" className="mt-4 w-full">View Suite</ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof DatabaseZap; label: string; value: string }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-cyan-100" />
      <p className="mt-4 text-sm text-aura-muted">{label}</p>
      <strong className="mt-2 block font-orbitron text-2xl text-white">{value}</strong>
    </Card>
  )
}
