import { FolderKanban, Layers3, MessageSquareMore, Send, ServerCog, Wand2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useProjectMessages, useProjects } from '../../hooks/useFirebase'
import { requestRevision, sendProjectMessage } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { ProjectRecord } from '../../types'

export default function MyProjects() {
  const { user } = useAuth()
  const { data: projects, refetch } = useProjects(user?.uid)
  const [selectedId, setSelectedId] = useState('')
  const selected = projects.find((project) => project.id === selectedId) ?? projects[0]

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Requests</h1>
            <p className="mt-2 text-aura-muted">Private briefs, previews, and follow-up notes.</p>
          </div>
          <ButtonLink to="/dashboard/requests/new" className="px-3">New</ButtonLink>
        </div>
        <div className="mt-5 grid gap-2">
          {projects.map((project) => (
            <button key={project.id} onClick={() => setSelectedId(project.id)} className={`rounded-lg border p-3 text-left transition ${selected?.id === project.id ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}>
              <strong className="block truncate text-white">{project.title}</strong>
              <span className="mt-2 flex items-center justify-between gap-2 text-sm text-aura-muted"><span>{project.projectType}</span><Badge>{project.status}</Badge></span>
            </button>
          ))}
        </div>
        {!projects.length ? (
          <div className="mt-6 rounded-lg border border-dashed border-white/15 p-6 text-center">
            <FolderKanban className="mx-auto h-8 w-8 text-cyan-100" />
            <h2 className="mt-3 text-lg font-bold">No private requests yet</h2>
            <p className="mt-2 text-sm text-aura-muted">Create one for a site, app, dashboard, template adaptation, or custom software build.</p>
          </div>
        ) : null}
      </Card>
      {selected && user ? <RequestDetail project={selected} onRefresh={() => void refetch()} userId={user.uid} userName={user.displayName ?? 'AuraFlow Client'} /> : <RequestEmpty />}
    </div>
  )
}

function RequestDetail({ onRefresh, project, userId, userName }: { onRefresh: () => void; project: ProjectRecord; userId: string; userName: string }) {
  const messages = useProjectMessages(project.id)
  const [loading, setLoading] = useState(false)

  const revise = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const note = String(new FormData(event.currentTarget).get('note') ?? '')
    setLoading(true)
    try {
      await requestRevision(project.id, note)
      await sendProjectMessage(project.id, { authorId: userId, authorName: userName, role: 'client', text: `Revision note: ${note}` })
      toast.success('Revision note sent.')
      event.currentTarget.reset()
      onRefresh()
      void messages.refetch()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const chat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const text = String(new FormData(form).get('message') ?? '')
    setLoading(true)
    try {
      await sendProjectMessage(project.id, { authorId: userId, authorName: userName, role: 'client', text })
      toast.success('Message sent to AuraFlow.')
      form.reset()
      void messages.refetch()
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row">
          <div>
            <Badge>{project.status}</Badge>
            <h2 className="mt-4 text-3xl font-extrabold">{project.title}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-aura-muted">{project.description}</p>
          </div>
          <dl className="grid min-w-64 gap-2 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
            <Info label="Type" value={project.projectType} />
            <Info label="Timeline" value={project.timeline} />
            <Info label="Deadline" value={project.deadline ?? 'Awaiting AuraFlow update'} />
            <Info label="Budget" value={`$${project.budget.toLocaleString()}`} />
          </dl>
        </div>
        {project.adminSummary ? <p className="mt-5 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4 text-cyan-50">{project.adminSummary}</p> : null}
        {project.solutionSlug || project.prototypeSpec ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="inline-flex items-center gap-2 text-xl font-bold"><ServerCog className="h-5 w-5 text-cyan-100" /> Platform blueprint</h3>
            <div className="mt-4 grid gap-3 text-sm text-aura-muted md:grid-cols-3">
              <Info label="Mode" value={project.platformMode ?? project.prototypeSpec?.platformMode ?? 'Custom build'} />
              <Info label="Preferred link" value={project.subdomainPreference ?? project.prototypeSpec?.subdomainPreference ?? 'To be confirmed'} />
              <Info label="Solution" value={project.solutionSlug ?? project.prototypeSpec?.solutionSlug ?? 'Custom'} />
            </div>
            {project.prototypeSpec?.selectedModules?.length ? (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-white"><Layers3 className="h-4 w-4 text-cyan-100" /> Selected modules</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.prototypeSpec.selectedModules.map((module) => <Badge key={module} className="bg-white/[0.07] text-white">{module}</Badge>)}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-2xl font-bold">AuraFlow previews</h3>
          <p className="mt-2 text-aura-muted">Preview files uploaded directly for this request.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {project.previews.map((preview) => (
              <a key={preview.id} href={preview.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                {preview.contentType?.startsWith('image/') ? (
                  <img src={preview.url} alt={preview.name} className="aspect-video w-full object-cover" />
                ) : (
                  <span className="grid aspect-video place-items-center border-b border-white/10 px-4 text-center font-bold text-cyan-100">Open preview file</span>
                )}
                <span className="block truncate p-3 text-sm text-cyan-100">{preview.name}</span>
              </a>
            ))}
            {!project.previews.length ? <p className="rounded-lg border border-dashed border-white/15 p-4 text-aura-muted">Preview uploads will appear here.</p> : null}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-2xl font-bold">Your source files</h3>
          <p className="mt-2 text-aura-muted">References, content images, PDFs, and template files attached to this brief.</p>
          <div className="mt-4 grid gap-2">
            {project.assets.map((asset) => <a key={asset.id} className="truncate rounded-md border border-white/10 px-3 py-2 text-cyan-100" href={asset.url} target="_blank" rel="noreferrer">{asset.name}</a>)}
            {!project.assets.length ? <p className="rounded-lg border border-dashed border-white/15 p-4 text-aura-muted">No source files uploaded yet.</p> : null}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <Card className="p-5">
          <h3 className="inline-flex items-center gap-2 text-2xl font-bold"><Wand2 className="h-5 w-5 text-cyan-100" /> Revision note</h3>
          <form onSubmit={revise} className="mt-4 grid gap-3">
            <Textarea name="note" minLength={20} required placeholder="Say what needs to change, be added, removed, or refined in the next preview." />
            <Button type="submit" loading={loading}>Send Follow-up Request</Button>
          </form>
        </Card>
        <Card className="p-5">
          <h3 className="inline-flex items-center gap-2 text-2xl font-bold"><MessageSquareMore className="h-5 w-5 text-cyan-100" /> Project chat</h3>
          <div className="mt-4 grid max-h-80 gap-2 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3">
            {messages.data.map((message) => <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === 'admin' ? 'bg-cyan-300/12 text-cyan-50' : 'bg-white/[0.07] text-aura-muted'}`}><strong className="block text-white">{message.authorName}</strong>{message.text}</div>)}
            {!messages.data.length ? <p className="p-3 text-aura-muted">Start the project conversation here.</p> : null}
          </div>
          <form onSubmit={chat} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Textarea name="message" minLength={2} required className="min-h-11" placeholder="Message AuraFlow about this request" />
            <Button type="submit" loading={loading} className="shrink-0"><Send className="h-4 w-4" /> Send</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

function RequestEmpty() {
  return <Card className="grid min-h-72 place-items-center p-8 text-center text-aura-muted">Select a request to inspect its status, previews, revisions, and chat.</Card>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-aura-muted">{label}</dt><dd className="mt-0.5 text-white">{value}</dd></div>
}
