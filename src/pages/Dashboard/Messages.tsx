import { MessageSquareMore, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useProjectMessages, useProjects } from '../../hooks/useFirebase'
import { sendProjectMessage } from '../../lib/firestore'
import { asErrorMessage } from '../../lib/utils'
import type { ProjectRecord } from '../../types'

export default function Messages() {
  const { profile, user } = useAuth()
  const projects = useProjects(user?.uid)
  const [selectedId, setSelectedId] = useState('')
  const selected = projects.data.find((project) => project.id === selectedId) ?? projects.data[0]

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <Card className="p-4">
        <Badge>Client Chat</Badge>
        <h1 className="mt-4 text-3xl font-extrabold">Messages</h1>
        <p className="mt-2 text-aura-muted">Each conversation stays attached to one private request.</p>
        <div className="mt-5 grid gap-2">
          {projects.data.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className={`rounded-lg border p-3 text-left transition ${selected?.id === project.id ? 'border-cyan-200 bg-cyan-300/12' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
            >
              <strong className="block truncate text-white">{project.title}</strong>
              <span className="mt-2 block text-sm text-aura-muted">{project.status}</span>
            </button>
          ))}
        </div>
        {!projects.data.length ? (
          <div className="mt-5 rounded-lg border border-dashed border-white/15 p-4 text-sm text-aura-muted">
            Create a request first so uploads, previews, changes, and chat share the same private project record.
            <ButtonLink to="/dashboard/requests/new" className="mt-3 w-full">New Request</ButtonLink>
          </div>
        ) : null}
      </Card>
      {selected && user ? (
        <MessageThread project={selected} userId={user.uid} userName={profile?.name ?? user.displayName ?? 'AuraFlow Client'} />
      ) : (
        <Card className="grid min-h-80 place-items-center p-6 text-center text-aura-muted">Your project chatbox will appear here after the first request exists.</Card>
      )}
    </div>
  )
}

function MessageThread({ project, userId, userName }: { project: ProjectRecord; userId: string; userName: string }) {
  const messages = useProjectMessages(project.id)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const text = String(new FormData(form).get('message') ?? '').trim()
    setLoading(true)
    try {
      await sendProjectMessage(project.id, { authorId: userId, authorName: userName, role: 'client', text })
      form.reset()
      void messages.refetch()
      toast.success('Message sent to AuraFlow.')
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="grid min-h-[34rem] content-start p-5">
      <h2 className="inline-flex items-center gap-2 text-3xl font-extrabold">
        <MessageSquareMore className="h-6 w-6 text-cyan-100" />
        {project.title}
      </h2>
      <p className="mt-2 text-aura-muted">Status, previews, revision notes, and this chat are private to this request and AuraFlow admins.</p>
      <div className="mt-5 grid max-h-[26rem] gap-2 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.data.map((message) => (
          <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === 'admin' ? 'bg-cyan-300/12 text-cyan-50' : 'bg-white/[0.07] text-aura-muted'}`}>
            <strong className="block text-white">{message.authorName}</strong>
            {message.text}
          </div>
        ))}
        {!messages.data.length ? <p className="p-3 text-aura-muted">Start the project conversation here.</p> : null}
      </div>
      <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Textarea name="message" minLength={2} required className="min-h-12" placeholder="Message AuraFlow about this request" />
        <Button type="submit" loading={loading} className="h-fit">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </Card>
  )
}
