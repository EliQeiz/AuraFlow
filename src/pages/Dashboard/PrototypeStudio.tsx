import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileImage, Layers3, MonitorSmartphone, Send, ServerCog, Sparkles, UploadCloud } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { industrySolutions, platformModes } from '../../data/solutions'
import { uploadProjectAsset } from '../../lib/auth'
import { attachProjectAsset, createProjectRequest } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { PlatformMode, PrototypeSpec } from '../../types'

export default function PrototypeStudio() {
  const { profile, user } = useAuth()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('solution')
  const initial = industrySolutions.find((solution) => solution.slug === requested) ?? industrySolutions[0]
  const [activeSlug, setActiveSlug] = useState(initial.slug)
  const [selectedModules, setSelectedModules] = useState<string[]>(initial.modules.slice(0, 5))
  const [platformMode, setPlatformMode] = useState<PlatformMode>('managed-hosted')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [sentId, setSentId] = useState('')
  const active = useMemo(() => industrySolutions.find((solution) => solution.slug === activeSlug) ?? industrySolutions[0], [activeSlug])

  const chooseSolution = (slug: string) => {
    const next = industrySolutions.find((solution) => solution.slug === slug) ?? industrySolutions[0]
    setActiveSlug(next.slug)
    setSelectedModules(next.modules.slice(0, 5))
  }

  const toggleModule = (module: string) => {
    setSelectedModules((current) => (current.includes(module) ? current.filter((item) => item !== module) : [...current, module]))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !user.email) return
    if (!selectedModules.length) {
      toast.error('Choose at least one module for the prototype.')
      return
    }

    const data = new FormData(event.currentTarget)
    const businessName = String(data.get('businessName') ?? '').trim()
    const subdomainPreference = String(data.get('subdomainPreference') ?? '').trim()
    const coreWorkflows = String(data.get('coreWorkflows') ?? '').trim()
    const contentNotes = String(data.get('contentNotes') ?? '').trim()
    const prototypeSpec: PrototypeSpec = {
      solutionSlug: active.slug,
      businessName,
      platformMode,
      subdomainPreference,
      selectedModules,
      brandTone: String(data.get('brandTone') ?? ''),
      colorPreference: String(data.get('colorPreference') ?? ''),
      adminRoles: active.roles,
      coreWorkflows,
      contentNotes,
    }

    setLoading(true)
    try {
      const request = await createProjectRequest({
        userId: user.uid,
        clientName: profile?.name ?? user.displayName ?? businessName,
        clientEmail: user.email,
        title: `${businessName || active.title} prototype`,
        projectType: active.title,
        description: [
          `${businessName || 'This business'} wants a ${active.title}.`,
          `Platform mode: ${platformModes.find((mode) => mode.id === platformMode)?.label}.`,
          `Selected modules: ${selectedModules.join(', ')}.`,
          `Core workflows: ${coreWorkflows}`,
          `Content/assets: ${contentNotes}`,
        ].join('\n\n'),
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

      for (const file of files.slice(0, 8)) {
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
      toast.success('Prototype request sent to AuraFlow.')
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
        <Badge>Prototype Sent</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Your design blueprint is now a private AuraFlow request.</h1>
        <p className="mt-3 max-w-2xl text-aura-muted">You can track status, preview uploads, revision notes, and chat from the Requests and Messages tabs.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/dashboard/requests" className="text-sm font-bold text-cyan-100">Open Requests</Link>
          <Link to="/dashboard/messages" className="text-sm font-bold text-cyan-100">Open Messages</Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[350px_1fr]">
      <Card className="h-fit p-4 xl:sticky xl:top-24">
        <Badge>Prototype Studio</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Choose the system.</h1>
        <p className="mt-2 text-aura-muted">Start from a real business platform, then shape the modules and design brief.</p>
        <div className="mt-5 grid max-h-[34rem] gap-2 overflow-auto pr-1">
          {industrySolutions.map((solution) => (
            <button
              key={solution.id}
              onClick={() => chooseSolution(solution.slug)}
              className={`rounded-lg border p-3 text-left transition ${active.slug === solution.slug ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
            >
              <strong className="block truncate text-white">{solution.title}</strong>
              <span className="mt-1 block text-xs text-aura-muted">{solution.category} - {solution.startingPrice}</span>
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
            <p className="mt-3 leading-7 text-aura-muted">{active.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric icon={ServerCog} label="Hosted link" value={active.platformLabel} />
              <Metric icon={MonitorSmartphone} label="Roles" value={`${active.roles.length} roles`} />
              <Metric icon={Layers3} label="Modules" value={`${active.modules.length}+`} />
            </div>
          </div>
        </Card>

        <form onSubmit={submit} className="grid gap-4">
          <Card className="p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-5 w-5 text-cyan-100" /> Platform mode</h2>
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
            <h2 className="text-2xl font-bold">Modules and workflow</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.modules.map((module) => (
                <button
                  key={module}
                  type="button"
                  onClick={() => toggleModule(module)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${selectedModules.includes(module) ? 'border-cyan-200 bg-cyan-300/15 text-white' : 'border-white/10 bg-black/20 text-aura-muted'}`}
                >
                  {selectedModules.includes(module) ? <Check className="h-4 w-4 text-cyan-100" /> : null}
                  {module}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mt-5 grid gap-3 sm:grid-cols-2">
                {active.workflows.map((workflow) => (
                  <div key={workflow} className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm text-aura-muted">{workflow}</div>
                ))}
              </motion.div>
            </AnimatePresence>
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-2xl font-bold">Business and design brief</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business or project name"><Input name="businessName" required placeholder="Crestview Academy, Kente Mart, Afari Foods..." /></Field>
              <Field label="Preferred hosted link"><Input name="subdomainPreference" placeholder="crestview.auraflow.app" /></Field>
              <Field label="Brand tone"><Select name="brandTone" defaultValue="Professional and modern"><option>Professional and modern</option><option>Luxury and editorial</option><option>Warm and local</option><option>Bold and energetic</option><option>Minimal and calm</option></Select></Field>
              <Field label="Color direction"><Input name="colorPreference" placeholder="Navy, gold, emerald, white..." /></Field>
              <Field label="Working budget in USD"><Input name="budget" type="number" min={39} max={100000} defaultValue={499} required /></Field>
              <Field label="Timeline"><Select name="timeline" defaultValue="Standard"><option>Flexible</option><option>Standard</option><option>Launch this month</option><option>Urgent</option></Select></Field>
            </div>
            <Field label="Core workflows">
              <Textarea name="coreWorkflows" minLength={30} required placeholder="Describe what users, staff, admins, parents, customers, guests, or managers should be able to do." />
            </Field>
            <Field label="Content, images, and data needed">
              <Textarea name="contentNotes" minLength={20} required placeholder="Food photos, rooms, products, school logo, staff photos, dashboards, forms, existing spreadsheet data, or sample references." />
            </Field>
            <Field label="Reference links">
              <Textarea name="referenceLinks" className="min-h-24" placeholder="One URL per line. Use links you are allowed to share." />
            </Field>
            <label className="grid gap-2 rounded-lg border border-dashed border-cyan-200/35 bg-cyan-300/10 p-4 text-sm text-aura-muted">
              <span className="inline-flex items-center gap-2 font-bold text-white"><UploadCloud className="h-4 w-4" /> Upload design references and content</span>
              <span>Images or PDFs up to 8 files and 10MB each. Upload products, food, rooms, people, logos, screenshots, layouts, forms, or documents.</span>
              <Input multiple accept="image/*,application/pdf" type="file" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
            </label>
            <Button type="submit" loading={loading} className="w-full sm:w-fit">
              <Send className="h-4 w-4" />
              Send Prototype Blueprint
            </Button>
          </Card>

          <Card className="p-5">
            <FileImage className="h-5 w-5 text-cyan-100" />
            <h2 className="mt-4 text-xl font-bold">What AuraFlow receives</h2>
            <p className="mt-2 leading-7 text-aura-muted">
              The selected platform, modules, hosting mode, preferred link, workflows, brand direction, files, and reference links are stored on your private request. Only your account and AuraFlow admins can see it.
            </p>
          </Card>
        </form>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof ServerCog; label: string; value: string }) {
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
