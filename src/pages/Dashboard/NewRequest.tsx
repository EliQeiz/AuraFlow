import { FileImage, LayoutTemplate, Send, UploadCloud } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { services } from '../../data/services'
import { industrySolutions } from '../../data/solutions'
import { getSuiteBlueprint } from '../../data/suiteBlueprints'
import { templates } from '../../data/templates'
import { requestAssetAccept, uploadProjectAsset } from '../../lib/auth'
import { attachProjectAsset, createProjectRequest } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'

export default function NewRequest() {
  const { profile, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [sentId, setSentId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const selectedTemplate = templates.find((template) => template.slug === searchParams.get('template'))
  const selectedSolution = industrySolutions.find((solution) => solution.slug === searchParams.get('solution'))
  const selectedSuite = getSuiteBlueprint(searchParams.get('suite') ?? selectedSolution?.slug)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !user.email) return
    const data = new FormData(event.currentTarget)
    setLoading(true)
    try {
      const title = String(data.get('title') ?? '').trim()
      const description = String(data.get('description') ?? '').trim()
      const contentNotes = files.length
        ? 'Client attached files for content, design direction, data, or reference material.'
        : 'Client submitted a written brief; content assets will be collected during discovery.'
      const request = await createProjectRequest({
        userId: user.uid,
        clientName: profile?.name ?? user.displayName ?? user.email ?? 'AuraFlow Client',
        clientEmail: user.email,
        title,
        projectType: String(data.get('projectType')),
        description,
        audience: String(data.get('audience')),
        budget: Number(data.get('budget')),
        timeline: String(data.get('timeline')),
        referenceLinks: String(data.get('referenceLinks'))
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8),
        templateSlug: selectedTemplate?.slug,
        solutionSlug: selectedSuite?.slug ?? selectedSolution?.slug,
        platformMode: selectedSuite || selectedSolution ? 'managed-hosted' : 'custom-build',
        subdomainPreference: selectedSuite || selectedSolution ? String(data.get('subdomainPreference') ?? '').trim() : undefined,
        prototypeSpec: selectedSuite
          ? {
              solutionSlug: selectedSuite.slug,
              suiteSlug: selectedSuite.slug,
              businessName: title,
              platformMode: 'managed-hosted',
              subdomainPreference: String(data.get('subdomainPreference') ?? '').trim(),
              selectedModules: selectedSuite.modules.slice(0, 6).map((module) => module.title),
              selectedWorkflows: selectedSuite.workflows.slice(0, 3).map((workflow) => workflow.title),
              selectedRoles: selectedSuite.roles.slice(0, 5).map((role) => role.title),
              brandTone: 'To be refined in AuraFlow Studio',
              colorPreference: 'To be refined in AuraFlow Studio',
              adminRoles: selectedSuite.roles.slice(0, 5).map((role) => role.title),
              coreWorkflows: description,
              contentNotes,
              launchModel: 'Low-cost hosted system',
            }
          : undefined,
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
      toast.success('Your private request is ready for AuraFlow review.')
      event.currentTarget.reset()
      setFiles([])
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  if (sentId) {
    return (
      <Card className="p-6">
        <Badge>Request Submitted</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Your project brief is inside the client app.</h1>
        <p className="mt-3 max-w-2xl text-aura-muted">Use Requests to track status, previews, revision notes, and chat with AuraFlow for this project.</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="p-4 sm:p-6">
        <Badge>Private Intake</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Describe exactly what AuraFlow should build.</h1>
        <p className="mt-3 max-w-3xl text-aura-muted">Share the product shape, audience, references, images, photos, documents, and content that belong in the site, app, dashboard, hosted platform, or software.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Project title"><Input name="title" required defaultValue={selectedSuite?.title ?? selectedSolution?.title ?? ''} placeholder="Accra food delivery app" /></Field>
            <Field label="Project type">
              <Select name="projectType" defaultValue={selectedSuite?.title ?? selectedSolution?.title ?? searchParams.get('service') ?? ''} required>
                <option value="">Select type</option>
                {industrySolutions.map((solution) => <option key={solution.id} value={solution.title}>{solution.title}</option>)}
                {services.map((service) => <option key={service.id} value={service.title}>{service.title}</option>)}
                <option>Custom Software</option>
              </Select>
            </Field>
            <Field label="Target audience"><Input name="audience" required defaultValue={selectedSuite?.audience ?? selectedSolution?.audience ?? ''} placeholder="Customers, staff, partners..." /></Field>
            <Field label="Timeline"><Select name="timeline" required><option>Flexible</option><option>Standard</option><option>Launch this month</option><option>Urgent</option></Select></Field>
          </div>
          <Field label="Full description">
            <Textarea
              name="description"
              minLength={40}
              required
              defaultValue={selectedSuite ? `${selectedSuite.summary}\n\nImportant modules: ${selectedSuite.modules.slice(0, 6).map((module) => module.title).join(', ')}.` : selectedSolution ? `${selectedSolution.summary}\n\nImportant modules: ${selectedSolution.modules.slice(0, 6).join(', ')}.` : ''}
              placeholder="Pages, workflows, dashboards, booking, payments, content, Ghana or market context, must-have features, and what success looks like."
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Working budget in USD"><Input name="budget" type="number" min={39} max={100000} defaultValue={selectedSuite || selectedSolution ? 499 : 2500} required /></Field>
            <Field label="Preferred hosted link">
              <Input name="subdomainPreference" defaultValue={selectedSuite?.platformLabel ?? selectedSolution?.platformLabel ?? ''} placeholder="yourbusiness.auraflow.app" />
            </Field>
            <Field label="Reference links">
              <Textarea name="referenceLinks" className="min-h-24" placeholder="One URL per line for inspiration or existing assets" />
            </Field>
          </div>
          <label className="grid gap-2 rounded-lg border border-dashed border-cyan-200/35 bg-cyan-300/10 p-4 text-sm text-aura-muted">
            <span className="inline-flex items-center gap-2 font-bold text-white"><UploadCloud className="h-4 w-4" /> Upload references and content</span>
            <span>Images, PDFs, Office files, CSV/JSON/text, or ZIP packs up to 8 files and 25MB each. Add food photos, properties, people, screenshots, sketches, branding, data, or content files.</span>
            <Input multiple accept={requestAssetAccept} type="file" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
          </label>
          <Button type="submit" loading={loading} className="w-full sm:w-fit"><Send className="h-4 w-4" /> Send Private Request</Button>
        </form>
      </Card>
      <div className="grid content-start gap-4">
        <Card className="p-5">
          <LayoutTemplate className="h-5 w-5 text-cyan-100" />
          <h2 className="mt-4 text-xl font-bold">Template reference</h2>
          <p className="mt-2 text-aura-muted">{selectedTemplate ? `${selectedTemplate.name} will be attached to this brief.` : 'Browse client templates and choose one as a starting point.'}</p>
        </Card>
        {selectedSuite ? (
          <Card className="p-5">
            <ServerSummary solutionSlug={selectedSuite.slug} title={selectedSuite.title} modules={selectedSuite.modules.slice(0, 5).map((module) => module.title)} />
          </Card>
        ) : null}
        <Card className="p-5">
          <FileImage className="h-5 w-5 text-cyan-100" />
          <h2 className="mt-4 text-xl font-bold">Your privacy boundary</h2>
          <p className="mt-2 text-aura-muted">Only your account and AuraFlow admins can read your project brief, uploaded references, previews, messages, and revision notes.</p>
        </Card>
      </div>
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm text-aura-muted">{label}{children}</label>
}

function ServerSummary({ modules, solutionSlug, title }: { modules: string[]; solutionSlug: string; title: string }) {
  return (
    <>
      <LayoutTemplate className="h-5 w-5 text-cyan-100" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-aura-muted">This hosted-system context is attached to the request.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {modules.map((module) => <Badge key={module} className="bg-white/[0.07] text-white">{module}</Badge>)}
      </div>
      <p className="mt-3 font-mono text-xs text-cyan-100">{solutionSlug}</p>
    </>
  )
}
