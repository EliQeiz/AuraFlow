import { AnimatePresence, motion } from 'framer-motion'
import { Check, DatabaseZap, FileImage, Layers3, MonitorSmartphone, Palette, Send, ServerCog, Sparkles, UploadCloud, UsersRound, Waypoints } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { SuitePreviewPanel } from '../../components/shared/SuitePreviewPanel'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { platformModes } from '../../data/solutions'
import { getSuiteBlueprint, suiteBlueprints } from '../../data/suiteBlueprints'
import { requestAssetAccept, uploadProjectAsset } from '../../lib/auth'
import { attachProjectAsset, createProjectRequest } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { PlatformMode, PrototypeSpec } from '../../types'

const initialModulesFor = (slug: string) => (getSuiteBlueprint(slug) ?? suiteBlueprints[0]).modules.slice(0, 6).map((module) => module.title)
const initialRolesFor = (slug: string) => (getSuiteBlueprint(slug) ?? suiteBlueprints[0]).roles.slice(0, 5).map((role) => role.title)
const initialWorkflowsFor = (slug: string) => (getSuiteBlueprint(slug) ?? suiteBlueprints[0]).workflows.slice(0, 3).map((workflow) => workflow.title)
const initialBuilderFeaturesFor = (slug: string) => (getSuiteBlueprint(slug) ?? suiteBlueprints[0]).builderFeatures.slice(0, 5).map((feature) => feature.title)

export default function PrototypeStudio() {
  const { profile, user } = useAuth()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('solution') ?? searchParams.get('suite')
  const initial = getSuiteBlueprint(requested) ?? suiteBlueprints[0]
  const [activeSlug, setActiveSlug] = useState(initial.slug)
  const [selectedModules, setSelectedModules] = useState<string[]>(initialModulesFor(initial.slug))
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRolesFor(initial.slug))
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>(initialWorkflowsFor(initial.slug))
  const [selectedBuilderFeatures, setSelectedBuilderFeatures] = useState<string[]>(initialBuilderFeaturesFor(initial.slug))
  const [platformMode, setPlatformMode] = useState<PlatformMode>('managed-hosted')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [sentId, setSentId] = useState('')
  const active = useMemo(() => getSuiteBlueprint(activeSlug) ?? suiteBlueprints[0], [activeSlug])

  const chooseSuite = (slug: string) => {
    const next = getSuiteBlueprint(slug) ?? suiteBlueprints[0]
    setActiveSlug(next.slug)
    setSelectedModules(initialModulesFor(next.slug))
    setSelectedRoles(initialRolesFor(next.slug))
    setSelectedWorkflows(initialWorkflowsFor(next.slug))
    setSelectedBuilderFeatures(initialBuilderFeaturesFor(next.slug))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !user.email) return
    if (!selectedModules.length) {
      toast.error('Choose at least one module for the prototype.')
      return
    }
    if (!selectedRoles.length) {
      toast.error('Choose at least one role or portal.')
      return
    }

    const data = new FormData(event.currentTarget)
    if (!data.has('contentOwnershipConfirmed')) {
      toast.error('Confirm that uploaded content is safe for AuraFlow to use.')
      return
    }
    const businessName = String(data.get('businessName') ?? '').trim()
    const subdomainPreference = String(data.get('subdomainPreference') ?? '').trim()
    const coreWorkflows = String(data.get('coreWorkflows') ?? '').trim()
    const contentNotes = String(data.get('contentNotes') ?? '').trim()
    const dataSources = String(data.get('dataSources') ?? '').trim()
    const complianceNotes = String(data.get('complianceNotes') ?? '').trim()
    const launchModel = platformModes.find((mode) => mode.id === platformMode)?.label ?? 'Custom build'
    const themePreset = String(data.get('themePreset') ?? active.themes[0]?.name ?? 'Aura Dark')
    const primaryColor = String(data.get('primaryColor') ?? '#6C63FF')
    const accentColor = String(data.get('accentColor') ?? '#00D4FF')
    const logoDirection = String(data.get('logoDirection') ?? '').trim()
    const bannerDirection = String(data.get('bannerDirection') ?? '').trim()
    const mediaPlan = String(data.get('mediaPlan') ?? '').trim()
    const paymentPlan = String(data.get('paymentPlan') ?? '').trim()
    const tenantAdminNotes = String(data.get('tenantAdminNotes') ?? '').trim()
    const automationNeeds = String(data.get('automationNeeds') ?? '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12)
    const prototypeSpec: PrototypeSpec = {
      solutionSlug: active.slug,
      suiteSlug: active.slug,
      businessName,
      platformMode,
      subdomainPreference,
      selectedModules,
      selectedWorkflows,
      selectedRoles,
      brandTone: String(data.get('brandTone') ?? ''),
      colorPreference: String(data.get('colorPreference') ?? ''),
      adminRoles: selectedRoles,
      coreWorkflows,
      contentNotes,
      dataSources,
      complianceNotes,
      launchModel,
      selectedBuilderFeatures,
      themePreset,
      primaryColor,
      accentColor,
      logoDirection,
      bannerDirection,
      mediaPlan,
      automationNeeds,
      paymentPlan,
      tenantAdminNotes,
      contentOwnershipConfirmed: true,
    }

    setLoading(true)
    try {
      const request = await createProjectRequest({
        userId: user.uid,
        clientName: profile?.name ?? user.displayName ?? businessName,
        clientEmail: user.email,
        title: `${businessName || active.title} suite blueprint`,
        projectType: active.title,
        description: [
          `${businessName || 'This business'} wants a ${active.title}.`,
          `Launch model: ${launchModel}.`,
          `Selected modules: ${selectedModules.join(', ')}.`,
          `Selected portals: ${selectedRoles.join(', ')}.`,
          `Priority workflows: ${selectedWorkflows.join(', ') || 'To be scoped with AuraFlow'}.`,
          `Builder features: ${selectedBuilderFeatures.join(', ') || 'Core design brief only'}.`,
          `Theme: ${themePreset} (${primaryColor} / ${accentColor}).`,
          `Core workflows: ${coreWorkflows}`,
          `Content/assets: ${contentNotes}`,
          mediaPlan ? `Media plan: ${mediaPlan}` : '',
          logoDirection ? `Logo direction: ${logoDirection}` : '',
          bannerDirection ? `Banner direction: ${bannerDirection}` : '',
          dataSources ? `Data sources: ${dataSources}` : '',
          automationNeeds.length ? `Automation needs: ${automationNeeds.join('; ')}` : '',
          paymentPlan ? `Payment and booking logic: ${paymentPlan}` : '',
          tenantAdminNotes ? `Owner/admin controls: ${tenantAdminNotes}` : '',
          complianceNotes ? `Security and compliance notes: ${complianceNotes}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        audience: active.audience,
        budget: Number(data.get('budget')),
        timeline: String(data.get('timeline') ?? ''),
        referenceLinks: String(data.get('referenceLinks') ?? '')
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8),
        solutionSlug: active.slug,
        platformMode,
        subdomainPreference,
        prototypeSpec,
      })

      for (const file of files.slice(0, 12)) {
        const uploaded = await uploadProjectAsset(user.uid, request.id, file, 'references')
        await attachProjectAsset(request.id, {
          id: crypto.randomUUID(),
          ...uploaded,
          kind: file.type.startsWith('image/') ? 'content' : 'reference',
          uploadedBy: user.uid,
        })
      }

      setSentId(request.id)
      setFiles([])
      toast.success('Suite blueprint sent to AuraFlow.')
      event.currentTarget.reset()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (sentId) {
    return (
      <Card className="p-6">
        <Badge>Blueprint Sent</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Your suite design is now a private AuraFlow request.</h1>
        <p className="mt-3 max-w-2xl text-aura-muted">You can track status, preview uploads, revision notes, and chat from the Requests and Messages tabs.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/dashboard/requests" className="text-sm font-bold text-cyan-100">Open Requests</Link>
          <Link to="/dashboard/messages" className="text-sm font-bold text-cyan-100">Open Messages</Link>
          <Link to="/dashboard/studio" className="text-sm font-bold text-cyan-100">Create Another Blueprint</Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit p-4 xl:sticky xl:top-24">
        <Badge>Suite Builder</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Choose the platform.</h1>
        <p className="mt-2 text-aura-muted">Start from a full business system, then shape modules, portals, data, files, and launch model.</p>
        <div className="mt-5 grid max-h-[36rem] gap-2 overflow-auto pr-1">
          {suiteBlueprints.map((suite) => (
            <button
              key={suite.id}
              onClick={() => chooseSuite(suite.slug)}
              className={`rounded-lg border p-3 text-left transition ${active.slug === suite.slug ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
            >
              <strong className="block truncate text-white">{suite.title}</strong>
              <span className="mt-1 block text-xs text-aura-muted">{suite.category} - {suite.startingPrice}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="grid gap-5 overflow-hidden p-0 lg:grid-cols-[0.85fr_1fr]">
          <img src={active.image} alt={active.title} className="h-full min-h-72 w-full object-cover" />
          <div className="p-5">
            <Badge>{active.category}</Badge>
            <h2 className="mt-4 text-3xl font-extrabold">{active.title}</h2>
            <p className="mt-3 leading-7 text-aura-muted">{active.longDescription}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric icon={ServerCog} label="Hosted link" value={active.platformLabel} />
              <Metric icon={UsersRound} label="Role portals" value={`${active.roles.length} roles`} />
              <Metric icon={DatabaseZap} label="Data model" value={`${active.dataEntities.length}+ entities`} />
            </div>
          </div>
        </Card>

        <SuitePreviewPanel suite={active} selectedModules={selectedModules} selectedRoles={selectedRoles} selectedWorkflows={selectedWorkflows} selectedBuilderFeatures={selectedBuilderFeatures} />

        <form onSubmit={submit} className="grid gap-4">
          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-5 w-5 text-cyan-100" /> Launch model</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {platformModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPlatformMode(mode.id)}
                  className={`rounded-lg border p-4 text-left transition ${platformMode === mode.id ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                >
                  <strong className="block text-white">{mode.label}</strong>
                  <span className="mt-2 block text-sm leading-6 text-aura-muted">{mode.description}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Palette className="h-5 w-5 text-cyan-100" /> Design and automation studio</h2>
            <p className="mt-2 max-w-3xl text-aura-muted">Pick the exact tools AuraFlow should include in the prototype brief. These selections are saved with the request for admin review.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {active.builderFeatures.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleValue(feature.title, selectedBuilderFeatures, setSelectedBuilderFeatures)}
                  className={`rounded-lg border p-4 text-left transition ${selectedBuilderFeatures.includes(feature.title) ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                >
                  <strong className="block text-white">{feature.title}</strong>
                  <span className="mt-2 block text-sm leading-6 text-aura-muted">{feature.summary}</span>
                  <span className="mt-3 inline-flex text-xs font-bold text-cyan-100">{feature.output}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Theme preset">
                <Select name="themePreset" defaultValue={active.themes[0]?.name}>
                  {active.themes.map((theme) => <option key={theme.name}>{theme.name}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary color"><Input name="primaryColor" type="color" defaultValue="#6C63FF" className="h-12 p-1" /></Field>
                <Field label="Accent color"><Input name="accentColor" type="color" defaultValue="#00D4FF" className="h-12 p-1" /></Field>
              </div>
              <Field label="Logo and brand direction">
                <Textarea name="logoDirection" className="min-h-24" placeholder="Logo, crest, symbol, uniforms, menu identity, packaging, signage, or brand references." />
              </Field>
              <Field label="Hero banners and campaign visuals">
                <Textarea name="bannerDirection" className="min-h-24" placeholder="Homepage banner, admissions banner, hotel room hero, food campaign, sale banner, dashboard welcome screen..." />
              </Field>
              <Field label="Media plan">
                <Textarea name="mediaPlan" className="min-h-24" placeholder="Photos/videos needed: rooms, foods, products, classrooms, team, customers, gallery, behind-the-scenes, location..." />
              </Field>
              <Field label="Payment, booking, fees, or checkout logic">
                <Textarea name="paymentPlan" className="min-h-24" placeholder="Deposits, school fees, delivery fees, room booking payments, order confirmation, invoice flow, mobile money notes..." />
              </Field>
              <Field label="Automation needs">
                <Textarea name="automationNeeds" className="min-h-24" placeholder="One per line: fee reminder, booking confirmation, low stock alert, admission follow-up, order status message..." />
              </Field>
              <Field label="Owner/admin controls after launch">
                <Textarea name="tenantAdminNotes" className="min-h-24" placeholder="What should the owner be able to change without coding? Menu prices, rooms, products, students, staff, gallery, banners..." />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Layers3 className="h-5 w-5 text-cyan-100" /> Modules</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.modules.map((module) => (
                <PillToggle key={module.id} active={selectedModules.includes(module.title)} label={module.title} onClick={() => toggleValue(module.title, selectedModules, setSelectedModules)} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mt-5 grid gap-3 sm:grid-cols-2">
                {active.modules
                  .filter((module) => selectedModules.includes(module.title))
                  .slice(0, 6)
                  .map((module) => (
                    <div key={module.id} className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm text-aura-muted">
                      <strong className="block text-white">{module.category}</strong>
                      <span className="mt-1 block leading-6">{module.summary}</span>
                    </div>
                  ))}
              </motion.div>
            </AnimatePresence>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><UsersRound className="h-5 w-5 text-cyan-100" /> Roles and portals</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.roles.map((role) => (
                  <PillToggle key={role.id} active={selectedRoles.includes(role.title)} label={role.title} onClick={() => toggleValue(role.title, selectedRoles, setSelectedRoles)} />
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Waypoints className="h-5 w-5 text-cyan-100" /> Priority workflows</h2>
              <div className="mt-4 grid gap-2">
                {active.workflows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleValue(item.title, selectedWorkflows, setSelectedWorkflows)}
                    className={`rounded-lg border p-3 text-left transition ${selectedWorkflows.includes(item.title) ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                  >
                    <strong className="block text-white">{item.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-aura-muted">{item.output}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="grid gap-4 p-5">
            <h2 className="text-2xl font-bold">Business and design brief</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business, school, or project name"><Input name="businessName" required placeholder="Crestview Academy, Kente Mart, Afari Foods..." /></Field>
              <Field label="Preferred hosted link"><Input name="subdomainPreference" placeholder={active.platformLabel} /></Field>
              <Field label="Brand tone"><Select name="brandTone" defaultValue="Professional and modern"><option>Professional and modern</option><option>Luxury and editorial</option><option>Warm and local</option><option>Bold and energetic</option><option>Minimal and calm</option></Select></Field>
              <Field label="Color direction"><Input name="colorPreference" placeholder="Navy, gold, emerald, white..." /></Field>
              <Field label="Working budget in USD"><Input name="budget" type="number" min={39} max={100000} defaultValue={active.startingPrice.includes('$39') ? 199 : 499} required /></Field>
              <Field label="Timeline"><Select name="timeline" defaultValue="Standard"><option>Flexible</option><option>Standard</option><option>Launch this month</option><option>Urgent</option></Select></Field>
            </div>
            <Field label="Core workflows">
              <Textarea name="coreWorkflows" minLength={30} required placeholder="Describe what users, staff, admins, parents, customers, guests, or managers should be able to do." />
            </Field>
            <Field label="Content, images, and brand assets needed">
              <Textarea name="contentNotes" minLength={20} required placeholder="Food photos, rooms, products, school logo, staff photos, dashboards, forms, existing spreadsheet data, or sample references." />
            </Field>
            <Field label="Existing data sources">
              <Textarea name="dataSources" className="min-h-24" placeholder="Spreadsheets, paper forms, existing app exports, product lists, student/staff data, fee sheets, room lists, menus, or inventory files." />
            </Field>
            <Field label="Security, privacy, and approval notes">
              <Textarea name="complianceNotes" className="min-h-24" placeholder="Who should see what, payment handling, student data privacy, staff roles, admin approvals, medical records, or audit requirements." />
            </Field>
            <Field label="Reference links">
              <Textarea name="referenceLinks" className="min-h-24" placeholder="One URL per line. Use links you are allowed to share." />
            </Field>
            <label className="grid gap-2 rounded-lg border border-dashed border-cyan-200/35 bg-cyan-300/10 p-4 text-sm text-aura-muted">
              <span className="inline-flex items-center gap-2 font-bold text-white"><UploadCloud className="h-4 w-4" /> Upload templates, content, data, and references</span>
              <span>Images, videos, PDFs, Office files, CSV/JSON/text, or ZIP packs up to 12 files and 50MB each. Do not upload secrets, passwords, or private data you are not allowed to share.</span>
              <Input multiple accept={requestAssetAccept} type="file" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-aura-muted">
              <input name="contentOwnershipConfirmed" required type="checkbox" className="mt-1 accent-cyan-300" />
              <span>I confirm I have permission to share these files and references with AuraFlow for this request.</span>
            </label>
            <Button type="submit" loading={loading} className="w-full sm:w-fit">
              <Send className="h-4 w-4" />
              Send Suite Blueprint
            </Button>
          </Card>

          <Card className="p-5">
            <FileImage className="h-5 w-5 text-cyan-100" />
            <h2 className="mt-4 text-xl font-bold">What AuraFlow receives</h2>
            <p className="mt-2 leading-7 text-aura-muted">
              The selected suite, modules, role portals, priority workflows, launch model, preferred link, data sources, compliance notes, files, and references are stored on your private request. Only your account and AuraFlow admins can see it.
            </p>
          </Card>
        </form>
      </div>
    </div>
  )
}

function PillToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${active ? 'border-cyan-200 bg-cyan-300/15 text-white' : 'border-white/10 bg-black/20 text-aura-muted'}`}
    >
      {active ? <Check className="h-4 w-4 text-cyan-100" /> : null}
      {label}
    </button>
  )
}

function toggleValue(value: string, selected: string[], setSelected: (value: string[]) => void) {
  setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
}

function Metric({ icon: Icon, label, value }: { icon: typeof MonitorSmartphone; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <Icon className="h-4 w-4 text-cyan-100" />
      <span className="mt-2 block text-xs text-aura-muted">{label}</span>
      <strong className="mt-1 block break-words text-sm text-white">{value}</strong>
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm text-aura-muted">{label}{children}</label>
}
