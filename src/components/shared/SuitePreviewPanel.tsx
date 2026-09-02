import { CheckCircle2, DatabaseZap, LockKeyhole, MonitorSmartphone, Route, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { SuiteBlueprint } from '../../types'
import { Badge } from '../ui/Badge'

export function SuitePreviewPanel({
  className,
  compact = false,
  selectedModules = [],
  selectedRoles = [],
  selectedWorkflows = [],
  selectedBuilderFeatures = [],
  suite,
}: {
  className?: string
  compact?: boolean
  selectedModules?: string[]
  selectedRoles?: string[]
  selectedWorkflows?: string[]
  selectedBuilderFeatures?: string[]
  suite: SuiteBlueprint
}) {
  const modules = pickSelected(suite.modules, selectedModules, (module) => module.title).slice(0, compact ? 4 : 8)
  const roles = pickSelected(suite.roles, selectedRoles, (role) => role.title).slice(0, compact ? 4 : 7)
  const workflows = pickSelected(suite.workflows, selectedWorkflows, (item) => item.title).slice(0, compact ? 2 : 4)
  const builderFeatures = pickSelected(suite.builderFeatures, selectedBuilderFeatures, (feature) => feature.title).slice(0, compact ? 3 : 5)
  const screens = suite.prototypeScreens.slice(0, compact ? 3 : 5)

  return (
    <div className={cn('overflow-hidden rounded-lg border border-white/10 bg-black/25', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className="truncate font-mono text-xs text-cyan-100">{suite.platformLabel}</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.82fr_1fr]">
        <div className="relative min-h-72 overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
          <img src={suite.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-aura-dark via-aura-dark/62 to-aura-dark/18" />
          <div className="relative flex min-h-72 flex-col justify-end p-5">
            <Badge className="w-fit">{suite.category}</Badge>
            <h3 className="mt-3 text-3xl font-extrabold">{suite.title}</h3>
            <p className="mt-2 line-clamp-3 leading-7 text-aura-muted">{suite.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {suite.metrics.slice(0, 4).map((metric) => (
                <div key={metric.label} className="rounded-lg border border-white/10 bg-aura-dark/74 p-3 backdrop-blur">
                  <span className="block text-xs text-aura-muted">{metric.label}</span>
                  <strong className="mt-1 block font-orbitron text-lg text-white">{metric.value}</strong>
                  <span className="mt-1 block text-[11px] text-cyan-100">{metric.trend}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewStat icon={MonitorSmartphone} label="Screens" value={`${suite.prototypeScreens.length}`} />
            <PreviewStat icon={Route} label="Workflows" value={`${suite.workflows.length}`} />
            <PreviewStat icon={DatabaseZap} label="Entities" value={`${suite.dataEntities.length}+`} />
          </div>

          <div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2 className="h-4 w-4 text-cyan-100" />
              Selected modules
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {modules.map((module) => (
                <span key={module.id} className="rounded-md border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-50">
                  {module.title}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <LockKeyhole className="h-4 w-4 text-cyan-100" />
                Role portals
              </span>
              <div className="mt-3 grid gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between gap-2 rounded-md bg-black/25 px-3 py-2 text-xs">
                    <span className="font-bold text-white">{role.title}</span>
                    <span className="font-mono text-aura-muted">{role.portal}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-100" />
                Private controls
              </span>
              <div className="mt-3 grid gap-2">
                {suite.adminControls.slice(0, compact ? 3 : 5).map((control) => (
                  <div key={control} className="rounded-md bg-black/25 px-3 py-2 text-xs leading-5 text-aura-muted">
                    {control}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!compact ? (
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <span className="text-sm font-bold text-white">Prototype screens</span>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {screens.map((screen) => (
                  <div key={screen.route} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-white">{screen.title}</strong>
                      <span className="font-mono text-[11px] text-cyan-100">{screen.route}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-aura-muted">{screen.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-cyan-100" />
              Builder features
            </span>
            <div className="mt-3 grid gap-2">
              {builderFeatures.map((feature) => (
                <div key={feature.id} className="rounded-md bg-black/25 p-3">
                  <strong className="text-sm text-white">{feature.title}</strong>
                  <p className="mt-1 text-xs leading-5 text-aura-muted">{feature.output}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
            <span className="text-sm font-bold text-white">Workflow preview</span>
            <div className="mt-3 grid gap-2">
              {workflows.map((item) => (
                <div key={item.id} className="rounded-md bg-black/25 p-3">
                  <strong className="text-sm text-white">{item.title}</strong>
                  <p className="mt-1 text-xs leading-5 text-aura-muted">{item.steps.join(' -> ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ icon: Icon, label, value }: { icon: typeof MonitorSmartphone; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <Icon className="h-4 w-4 text-cyan-100" />
      <span className="mt-2 block text-xs text-aura-muted">{label}</span>
      <strong className="mt-1 block font-orbitron text-lg text-white">{value}</strong>
    </div>
  )
}

function pickSelected<T>(items: T[], selected: string[], labelFor: (item: T) => string) {
  if (!selected.length) return items
  const selectedSet = new Set(selected)
  const chosen = items.filter((item) => selectedSet.has(labelFor(item)))
  return chosen.length ? chosen : items
}
