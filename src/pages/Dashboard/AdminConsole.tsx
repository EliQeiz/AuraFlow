import {
  collection,
  documentId,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useAdminProjects, useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import { updateAdminProject, attachProjectPreview } from '../../lib/firestore'
import { uploadPrivateMedia, validateMedia } from '../../lib/media'
import { asErrorMessage } from '../../lib/utils'
import { requestStatuses } from '../../domain/projects'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { StatePanel } from '../../components/ui/StatePanel'
import { ChatThread } from '../../components/shared/ChatThread'
import { PrivateFile } from '../../components/shared/PrivateFile'
import { SuiteCanvas } from '../../components/shared/SuiteCanvas'
import type { ProjectRecord, RequestStatus } from '../../types'
import {
  AdminOperations,
  InternalNotes,
  ReplySnippets,
} from '../../components/shared/AdminOperations'
import { ProjectWorkflow } from '../../components/shared/ProjectWorkflow'

export default function AdminConsole() {
  const { admin, user } = useAuth()
  const projects = useAdminProjects(admin)
  const conversations = useLiveRows<{
    id: string
    userId: string
    name: string
  }>(
    ['support-inbox', user!.uid],
    () =>
      query(
        collection(getFirebaseDb(), 'conversations'),
        orderBy('updatedAt', 'desc'),
      ),
    admin,
  )
  const [tab, setTab] = useState('Projects')
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('project') || ''
  const setSelectedId = (id: string) =>
    setParams({ project: id }, { replace: true })
  const [conversationId, setConversationId] = useState('')
  const selectedProject = useLiveRows<ProjectRecord>(
    ['admin-selected-project', user!.uid, selectedId],
    () =>
      query(
        collection(getFirebaseDb(), 'projects'),
        where(documentId(), '==', selectedId),
      ),
    admin && Boolean(selectedId),
  )
  const selected =
    selectedProject.data[0] || projects.data.find((p) => p.id === selectedId)
  const conversation =
    conversations.data.find((c) => c.id === conversationId) ||
    conversations.data[0]
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Administration</h1>
          <p>
            Manage client work, review briefs, and keep conversations moving.
          </p>
        </div>
      </div>
      <div className="tab-bar" role="tablist" aria-label="Admin views">
        {['Projects', 'Support inbox', 'Saved replies'].map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === 'Saved replies' ? (
        <ReplySnippets manage />
      ) : tab === 'Support inbox' ? (
        conversations.isPending ? (
          <StatePanel loading />
        ) : conversations.error ? (
          <StatePanel
            error={conversations.error}
            retry={() => void conversations.refetch()}
          />
        ) : (
          <div className="messages-layout">
            <aside className="thread-list">
              {conversations.data.map((c) => (
                <button
                  key={c.id}
                  className="thread-item"
                  aria-pressed={conversation?.id === c.id}
                  onClick={() => setConversationId(c.id)}
                >
                  <strong>{c.name}</strong>
                  <small>Customer support</small>
                </button>
              ))}
            </aside>
            {conversation ? (
              <ChatThread
                key={conversation.id}
                support
                asAdmin
                id={conversation.id}
                title={conversation.name}
              />
            ) : (
              <StatePanel
                title="No support conversations yet"
                description="Client messages will appear here."
              />
            )}
          </div>
        )
      ) : (
        <>
          {projects.isPending ? (
            <StatePanel loading />
          ) : projects.error ? (
            <StatePanel
              error={projects.error}
              retry={() => void projects.refetch()}
            />
          ) : (
            <AdminOperations
              projects={projects.data}
              onSelect={setSelectedId}
            />
          )}
          {selected ? (
            <AdminProject key={selected.id} project={selected} />
          ) : selectedId ? (
            selectedProject.isPending ? (
              <StatePanel loading />
            ) : (
              <StatePanel
                error={
                  selectedProject.error ||
                  new Error('This project is no longer available.')
                }
                retry={() => void selectedProject.refetch()}
              />
            )
          ) : (
            <StatePanel
              title="Select a project to manage"
              description="Client briefs, files, design snapshots, and delivery controls appear here."
            />
          )}
        </>
      )}
    </>
  )
}
function AdminProject({ project }: { project: ProjectRecord }) {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [params] = useSearchParams()
  const [view, setView] = useState(
    params.get('view') === 'workflow' ? 'Workflow' : 'Delivery',
  )
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      await updateAdminProject(project.id, {
        status: String(data.get('status')) as RequestStatus,
        adminSummary: String(data.get('summary')),
        deadline: String(data.get('deadline')),
        stagingUrl: String(data.get('stagingUrl')),
        productionUrl: String(data.get('productionUrl')),
        tenantSlug: String(data.get('tenantSlug')),
      })
      toast.success('Project updated.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return
    setPending(true)
    setError('')
    try {
      validateMedia(file)
      const id = crypto.randomUUID()
      const path = `projects/${project.userId}/${project.id}/previews/${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100)}`
      await uploadPrivateMedia(path, file, (p) =>
        setProgress(`Uploading: ${p}%`),
      )
      await attachProjectPreview(project.id, {
        id,
        name: file.name,
        path,
        url: '',
        contentType: file.type,
        kind: 'preview',
        uploadedBy: user!.uid,
      })
      toast.success('Preview shared with client.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
      setProgress('')
    }
  }
  return (
    <div className="admin-project-detail mt-8">
      <div className="section-heading">
        <div>
          <span className="workspace-label">Selected project</span>
          <h2>{project.title}</h2>
          <p className="field-hint">
            {project.clientName} · {project.clientEmail}
          </p>
        </div>
        <span className="status" data-status={project.status}>
          {project.status}
        </span>
      </div>
      <div className="tab-bar" role="tablist" aria-label="Admin project views">
        {['Delivery', 'Workflow', 'Private notes'].map((value) => (
          <button
            role="tab"
            key={value}
            aria-selected={view === value}
            onClick={() => setView(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {view === 'Private notes' ? (
        <InternalNotes projectId={project.id} />
      ) : view === 'Workflow' ? (
        <ProjectWorkflow project={project} asAdmin />
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
          <section>
            <h2 className="mb-4">{project.title}</h2>
            <p className="detail-body mb-6">{project.description}</p>
            {project.design && (
              <div className="mb-6">
                <SuiteCanvas draft={project.design} />
              </div>
            )}
            <div className="file-list mb-6">
              {project.assets?.map((asset) => (
                <PrivateFile asset={asset} key={asset.id} />
              ))}
            </div>
            <form
              className="request-form border-t border-[var(--line)] pt-6"
              onSubmit={save}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Project status">
                  <Select name="status" defaultValue={project.status}>
                    {requestStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Agreed deadline">
                  <Input
                    name="deadline"
                    type="date"
                    defaultValue={
                      /^\d{4}-\d{2}-\d{2}$/.test(project.deadline || '')
                        ? project.deadline
                        : ''
                    }
                  />
                </Field>
              </div>
              <Field label="Progress update for client">
                <Textarea
                  name="summary"
                  defaultValue={project.adminSummary}
                  maxLength={6000}
                />
              </Field>
              <Field label="Staging preview URL">
                <Input
                  name="stagingUrl"
                  type="url"
                  defaultValue={project.stagingUrl}
                  placeholder="https://"
                />
              </Field>
              <Field label="Live platform URL">
                <Input
                  name="productionUrl"
                  type="url"
                  defaultValue={project.productionUrl}
                  placeholder="https://"
                />
              </Field>
              <Field label="Hosted system identifier">
                <Input
                  name="tenantSlug"
                  defaultValue={project.tenantSlug}
                  maxLength={120}
                />
              </Field>
              {error && (
                <p className="inline-alert error" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                loading={pending}
                className="justify-self-start"
              >
                Save changes
              </Button>
            </form>
            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <Field label="Share a preview file">
                <Input
                  type="file"
                  disabled={pending}
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
              </Field>
              {progress && (
                <p role="status" className="field-hint mt-3">
                  {progress}
                </p>
              )}
              <div className="file-list mt-4">
                {project.previews?.map((asset) => (
                  <PrivateFile key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          </section>
          <div className="border border-[var(--line)] rounded-md overflow-hidden self-start min-h-[520px]">
            <ChatThread id={project.id} title={project.clientName} asAdmin />
          </div>
        </div>
      )}
    </div>
  )
}
