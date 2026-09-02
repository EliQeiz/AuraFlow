import { Layers3, MessageSquareMore, Send, ServerCog, Shield, UploadCloud } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { SuitePreviewPanel } from '../../components/shared/SuitePreviewPanel'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { getSuiteBlueprint } from '../../data/suiteBlueprints'
import { requestAssetAccept, uploadProjectAsset } from '../../lib/auth'
import { attachProjectPreview, sendProjectMessage, updateAdminProject } from '../../lib/firestore'
import { useAdminProjects, useProjectMessages } from '../../hooks/useFirebase'
import { asErrorMessage } from '../../lib/utils'
import type { ProjectRecord, RequestStatus } from '../../types'

const statuses: RequestStatus[] = ['Submitted', 'Discovery', 'Designing', 'Building', 'Review', 'Completed', 'On Hold']

export default function AdminConsole() {
  const { admin, user } = useAuth()
  const projects = useAdminProjects(admin)
  const [selectedId, setSelectedId] = useState('')
  const selected = projects.data.find((project) => project.id === selectedId) ?? projects.data[0]

  if (!admin || !user) {
    return (
      <Card className="p-6">
        <Badge>Admin Only</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">AuraFlow admin controls are hidden for client accounts.</h1>
        <p className="mt-3 max-w-2xl text-aura-muted">Grant this creator account the Firebase admin claim from a trusted Admin SDK session, sign out, then sign back in.</p>
        <p className="mt-3 rounded-md border border-white/10 bg-black/20 p-3 font-mono text-xs text-cyan-100">UID: {user?.uid ?? 'Sign in first'}</p>
        <ButtonLink to="/dashboard/settings" variant="secondary" className="mt-4 w-fit">Open Settings</ButtonLink>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <h1 className="inline-flex items-center gap-2 text-3xl font-extrabold"><Shield className="h-6 w-6 text-cyan-100" /> Admin</h1>
        <p className="mt-2 text-aura-muted">Requests visible only to admin claims.</p>
        <div className="mt-5 grid gap-2">
          {projects.data.map((project) => <button key={project.id} onClick={() => setSelectedId(project.id)} className={`rounded-lg border p-3 text-left ${project.id === selected?.id ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20'}`}><strong className="block truncate text-white">{project.title}</strong><span className="mt-2 flex justify-between gap-2 text-sm text-aura-muted">{project.clientName}<Badge>{project.status}</Badge></span></button>)}
        </div>
      </Card>
      {selected ? <AdminProject project={selected} userId={user.uid} onRefresh={() => void projects.refetch()} /> : <Card className="p-6 text-aura-muted">Client requests will arrive here.</Card>}
    </div>
  )
}

function AdminProject({ onRefresh, project, userId }: { onRefresh: () => void; project: ProjectRecord; userId: string }) {
  const [loading, setLoading] = useState(false)
  const suite = getSuiteBlueprint(project.prototypeSpec?.suiteSlug ?? project.solutionSlug)
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await updateAdminProject(project.id, {
        status: String(data.get('status')) as RequestStatus,
        deadline: String(data.get('deadline')),
        adminSummary: String(data.get('summary')),
        tenantSlug: String(data.get('tenantSlug')),
        stagingUrl: String(data.get('stagingUrl')),
        productionUrl: String(data.get('productionUrl')),
      })
      const preview = (data.get('preview') as File | null)
      if (preview?.size) {
        const uploaded = await uploadProjectAsset(project.userId, project.id, preview, 'previews')
        await attachProjectPreview(project.id, { id: crypto.randomUUID(), ...uploaded, kind: 'preview', uploadedBy: userId })
      }
      toast.success('Client workspace updated.')
      onRefresh()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5">
      <Badge>{project.clientEmail}</Badge>
      <h2 className="mt-4 text-3xl font-extrabold">{project.title}</h2>
      <p className="mt-3 max-w-3xl text-aura-muted">{project.description}</p>
      {project.solutionSlug || project.prototypeSpec ? (
        <div className="mt-5 grid gap-3 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm text-aura-muted lg:grid-cols-3">
          <div>
            <span className="inline-flex items-center gap-2 font-bold text-white"><ServerCog className="h-4 w-4 text-cyan-100" /> Platform</span>
            <p className="mt-2">{project.platformMode ?? project.prototypeSpec?.platformMode ?? 'Custom build'}</p>
            <p className="mt-1 font-mono text-xs text-cyan-100">{project.subdomainPreference ?? project.prototypeSpec?.subdomainPreference}</p>
          </div>
          <div className="lg:col-span-2">
            <span className="inline-flex items-center gap-2 font-bold text-white"><Layers3 className="h-4 w-4 text-cyan-100" /> Selected modules</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(project.prototypeSpec?.selectedModules ?? []).map((module) => (
                <Badge key={module} className="bg-white/[0.07] text-white">{module}</Badge>
              ))}
              {!project.prototypeSpec?.selectedModules?.length ? <span>{project.solutionSlug}</span> : null}
            </div>
          </div>
          {project.prototypeSpec?.selectedRoles?.length ? (
            <div className="lg:col-span-3">
              <strong className="text-white">Requested portals</strong>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.prototypeSpec.selectedRoles.map((role) => (
                  <Badge key={role} className="bg-white/[0.07] text-white">{role}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {project.prototypeSpec?.selectedWorkflows?.length ? (
            <div className="lg:col-span-3">
              <strong className="text-white">Priority workflows</strong>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.prototypeSpec.selectedWorkflows.map((workflow) => (
                  <Badge key={workflow} className="bg-white/[0.07] text-white">{workflow}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {project.prototypeSpec ? (
            <div className="lg:col-span-3">
              <strong className="text-white">Prototype brief</strong>
              <p className="mt-2 whitespace-pre-line leading-7">{project.prototypeSpec.coreWorkflows}</p>
              <p className="mt-3 whitespace-pre-line leading-7">{project.prototypeSpec.contentNotes}</p>
              {project.prototypeSpec.dataSources ? <p className="mt-3 whitespace-pre-line leading-7">Data sources: {project.prototypeSpec.dataSources}</p> : null}
              {project.prototypeSpec.complianceNotes ? <p className="mt-3 whitespace-pre-line leading-7">Security notes: {project.prototypeSpec.complianceNotes}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {suite ? (
        <SuitePreviewPanel
          suite={suite}
          compact
          selectedModules={project.prototypeSpec?.selectedModules}
          selectedRoles={project.prototypeSpec?.selectedRoles}
          selectedWorkflows={project.prototypeSpec?.selectedWorkflows}
          className="mt-5"
        />
      ) : null}
      <form onSubmit={save} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-aura-muted">Status<Select name="status" defaultValue={project.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</Select></label>
          <label className="grid gap-2 text-sm text-aura-muted">Deadline<Input name="deadline" defaultValue={project.deadline} placeholder="July 18, 2026" /></label>
          <label className="grid gap-2 text-sm text-aura-muted">Tenant or hosted slug<Input name="tenantSlug" defaultValue={project.tenantSlug ?? project.subdomainPreference ?? ''} placeholder="crestview-academy" /></label>
          <label className="grid gap-2 text-sm text-aura-muted">Staging preview URL<Input name="stagingUrl" defaultValue={project.stagingUrl ?? ''} placeholder="https://preview.auraflow.app/..." /></label>
          <label className="grid gap-2 text-sm text-aura-muted md:col-span-2">Production URL<Input name="productionUrl" defaultValue={project.productionUrl ?? ''} placeholder="https://client.auraflow.app or custom domain" /></label>
        </div>
        <label className="grid gap-2 text-sm text-aura-muted">Client-visible progress summary<Textarea name="summary" defaultValue={project.adminSummary} placeholder="What has moved forward, what preview means, and the next step." /></label>
        <label className="grid gap-2 rounded-lg border border-dashed border-white/15 p-4 text-sm text-aura-muted"><span className="inline-flex items-center gap-2 font-bold text-white"><UploadCloud className="h-4 w-4" /> Upload preview or delivery file</span><Input name="preview" accept={requestAssetAccept} type="file" /></label>
        <Button type="submit" loading={loading} className="w-fit">Save Client Workspace</Button>
      </form>
      <AdminChat project={project} userId={userId} />
    </Card>
  )
}

function AdminChat({ project, userId }: { project: ProjectRecord; userId: string }) {
  const messages = useProjectMessages(project.id)
  const [loading, setLoading] = useState(false)

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const text = String(new FormData(form).get('message') ?? '').trim()
    setLoading(true)
    try {
      await sendProjectMessage(project.id, { authorId: userId, authorName: 'AuraFlow Admin', role: 'admin', text })
      form.reset()
      void messages.refetch()
      toast.success('Client message sent.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-7 border-t border-white/10 pt-6">
      <h3 className="inline-flex items-center gap-2 text-2xl font-bold"><MessageSquareMore className="h-5 w-5 text-cyan-100" /> Client chat</h3>
      <div className="mt-4 grid max-h-80 gap-2 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.data.map((message) => <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === 'admin' ? 'bg-cyan-300/12 text-cyan-50' : 'bg-white/[0.07] text-aura-muted'}`}><strong className="block text-white">{message.authorName}</strong>{message.text}</div>)}
        {!messages.data.length ? <p className="p-3 text-aura-muted">Client messages for this request will appear here.</p> : null}
      </div>
      <form onSubmit={send} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Textarea name="message" minLength={2} required className="min-h-12" placeholder="Reply to this client request" />
        <Button type="submit" loading={loading} className="h-fit"><Send className="h-4 w-4" /> Send</Button>
      </form>
    </section>
  )
}
