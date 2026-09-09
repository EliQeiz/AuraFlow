import { collection, limit, orderBy, query } from 'firebase/firestore'
import { Download, LockKeyhole, Plus, Search, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import {
  addInternalNote,
  bulkStatus,
  removeSnippet,
  saveSnippet,
  setPriority,
} from '../../lib/workflow'
import { asErrorMessage } from '../../lib/utils'
import {
  csvCell,
  type ProjectOps,
  type ReplySnippet,
} from '../../domain/workflow'
import { displayDate, requestStatuses } from '../../domain/projects'
import type { ProjectRecord, RequestStatus } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Input, Select, Textarea } from '../ui/Input'
import { StatePanel } from '../ui/StatePanel'

export function AdminOperations({
  projects,
  onSelect,
}: {
  projects: ProjectRecord[]
  onSelect: (id: string) => void
}) {
  const { user } = useAuth()
  const ops = useLiveRows<ProjectOps>(['project-ops', user!.uid], () =>
    query(collection(getFirebaseDb(), 'projectOps'), limit(1000)),
  )
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [status, setStatus] = useState<RequestStatus>('Discovery'),
    [selected, setSelected] = useState<string[]>([]),
    [pending, setPending] = useState(false)
  const priority = (id: string) =>
    ops.data.find((row) => row.id === id)?.priority || 'normal'
  const today = new Date().toISOString().slice(0, 10)
  const overdue = (p: ProjectRecord) =>
    p.status !== 'Completed' && Boolean(p.deadline && p.deadline < today)
  const rows = projects
    .filter(
      (p) =>
        `${p.title} ${p.clientName} ${p.clientEmail}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === 'all' ||
          (filter === 'overdue' && overdue(p)) ||
          (filter === 'urgent' && priority(p.id) === 'urgent') ||
          (filter === 'review' && p.status === 'Review')),
    )
    .sort(
      (a, b) =>
        ['urgent', 'high', 'normal'].indexOf(priority(a.id)) -
        ['urgent', 'high', 'normal'].indexOf(priority(b.id)),
    )
  async function run(action: () => Promise<unknown>) {
    setPending(true)
    try {
      await action()
    } catch (err) {
      toast.error(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  function exportReport() {
    const data = [
      [
        'Project',
        'Client',
        'Email',
        'Status',
        'Priority',
        'Agreed deadline',
        'Budget USD',
      ],
      ...rows.map((p) => [
        p.title,
        p.clientName,
        p.clientEmail,
        p.status,
        priority(p.id),
        p.deadline,
        p.budget,
      ]),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(
      new Blob(['\ufeff', data], { type: 'text/csv;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `auraflow-operations-${today}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(
      `Exported ${rows.length} projects. This report contains client information.`,
    )
  }
  return (
    <section className="operations">
      <div className="operations-metrics">
        {[
          {
            label: 'Active projects',
            value: projects.filter((p) => p.status !== 'Completed').length,
            filter: 'all',
          },
          {
            label: 'Awaiting review',
            value: projects.filter((p) => p.status === 'Review').length,
            filter: 'review',
          },
          {
            label: 'Overdue',
            value: projects.filter(overdue).length,
            filter: 'overdue',
          },
          {
            label: 'Urgent',
            value: projects.filter((p) => priority(p.id) === 'urgent').length,
            filter: 'urgent',
          },
        ].map((metric) => (
          <button
            key={metric.label}
            onClick={() => {
              setFilter(metric.filter)
              setSelected([])
            }}
            aria-pressed={filter === metric.filter}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </button>
        ))}
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search />
          <Input
            aria-label="Search client projects"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelected([])
            }}
            placeholder="Search projects or clients..."
          />
        </div>
        <Select
          aria-label="Workload filter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setSelected([])
          }}
        >
          <option value="all">All projects</option>
          <option value="review">Awaiting review</option>
          <option value="overdue">Overdue</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Button
          variant="secondary"
          disabled={!rows.length || ops.isPending || Boolean(ops.error)}
          onClick={exportReport}
        >
          <Download />
          Export report
        </Button>
      </div>
      {ops.error && (
        <StatePanel error={ops.error} retry={() => void ops.refetch()} />
      )}
      {selected.length > 0 && (
        <div className="bulk-toolbar">
          <strong>{selected.length} selected</strong>
          <Select
            aria-label="Bulk project status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RequestStatus)}
          >
            {requestStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Button
            loading={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Change ${selected.length} project(s) to ${status}? Clients will see this update.`,
                )
              )
                void run(async () => {
                  await bulkStatus(
                    projects.filter((p) => selected.includes(p.id)),
                    status,
                  )
                  setSelected([])
                  toast.success('Projects updated and activity recorded.')
                })
            }}
          >
            Apply status
          </Button>
          <Button variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Select</span>
              </th>
              <th>Project / client</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((project) => (
              <tr key={project.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${project.title}`}
                    checked={selected.includes(project.id)}
                    disabled={
                      pending ||
                      (selected.length >= 5 && !selected.includes(project.id))
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, project.id]
                          : selected.filter((id) => id !== project.id),
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className="row-link"
                    onClick={() => onSelect(project.id)}
                  >
                    {project.title}
                  </button>
                  <small className="block text-aura-muted mt-1">
                    {project.clientName} · {project.clientEmail}
                  </small>
                </td>
                <td>
                  <span className="status" data-status={project.status}>
                    {project.status}
                  </span>
                </td>
                <td>
                  <Select
                    aria-label={`Priority for ${project.title}`}
                    value={priority(project.id)}
                    disabled={pending || ops.isPending || Boolean(ops.error)}
                    onChange={(e) =>
                      void run(() => setPriority(project.id, e.target.value))
                    }
                  >
                    {['normal', 'high', 'urgent'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </Select>
                </td>
                <td className={overdue(project) ? 'text-red-400' : ''}>
                  {project.deadline || 'Not agreed'}
                </td>
                <td>
                  <Button variant="ghost" onClick={() => onSelect(project.id)}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <StatePanel title="No projects match this view" />}
      <p className="field-hint mt-3">
        Metrics and reports cover the latest {projects.length} projects (up to
        100). Bulk updates support five projects per batch.
      </p>
    </section>
  )
}
export function InternalNotes({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const rows = useLiveRows<{ id: string; text: string; createdAt?: unknown }>(
    ['internal-notes', user!.uid, projectId],
    () =>
      query(
        collection(getFirebaseDb(), 'projects', projectId, 'internalNotes'),
        orderBy('createdAt', 'desc'),
        limit(50),
      ),
  )
  const [pending, setPending] = useState(false)
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setPending(true)
    try {
      await addInternalNote(projectId, String(new FormData(form).get('note')))
      form.reset()
      toast.success('Internal note saved.')
    } catch (err) {
      toast.error(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="internal-notes">
      <h2>
        <LockKeyhole size={17} />
        Private team notes
      </h2>
      <p className="field-hint">
        Only administrators can read these notes. Client updates belong in the
        delivery workspace.
      </p>
      <form className="request-form mt-5" onSubmit={save}>
        <Field label="Internal note">
          <Textarea name="note" required minLength={3} maxLength={4000} />
        </Field>
        <Button type="submit" loading={pending} className="justify-self-start">
          <Plus />
          Add private note
        </Button>
      </form>
      {rows.isPending ? (
        <StatePanel loading />
      ) : rows.error ? (
        <StatePanel error={rows.error} retry={() => void rows.refetch()} />
      ) : (
        rows.data.map((row) => (
          <article className="private-note" key={row.id}>
            <time>{displayDate(row.createdAt)}</time>
            <p>{row.text}</p>
          </article>
        ))
      )}
    </section>
  )
}
export function ReplySnippets({
  onInsert,
  manage = false,
}: {
  onInsert?: (text: string) => void
  manage?: boolean
}) {
  const { user } = useAuth()
  const rows = useLiveRows<ReplySnippet>(['reply-snippets', user!.uid], () =>
    query(
      collection(getFirebaseDb(), 'users', user!.uid, 'snippets'),
      orderBy('title'),
      limit(100),
    ),
  )
  const [pending, setPending] = useState(false)
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget,
      data = new FormData(form)
    setPending(true)
    try {
      await saveSnippet(String(data.get('title')), String(data.get('text')))
      form.reset()
      toast.success('Reply saved.')
    } catch (err) {
      toast.error(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  if (!manage)
    return (
      <div className="reply-picker">
        <Select
          aria-label="Insert saved reply"
          value=""
          onChange={(e) =>
            onInsert?.(
              rows.data.find((row) => row.id === e.target.value)?.text || '',
            )
          }
          disabled={rows.isPending || Boolean(rows.error)}
        >
          <option value="">
            {rows.error ? 'Replies unavailable' : 'Insert saved reply...'}
          </option>
          {rows.data.map((row) => (
            <option key={row.id} value={row.id}>
              {row.title}
            </option>
          ))}
        </Select>
      </div>
    )
  return (
    <section className="snippets-manager">
      <h2>Saved replies</h2>
      <p className="field-hint">
        Your reusable responses, available in client and project conversations.
      </p>
      <form className="request-form mt-5" onSubmit={save}>
        <Field label="Reply title">
          <Input name="title" required minLength={2} maxLength={80} />
        </Field>
        <Field label="Reply text">
          <Textarea name="text" required minLength={2} maxLength={4000} />
        </Field>
        <Button type="submit" loading={pending} className="justify-self-start">
          <Plus />
          Save reply
        </Button>
      </form>
      {rows.error && (
        <StatePanel error={rows.error} retry={() => void rows.refetch()} />
      )}
      <div className="history-list mt-6">
        {rows.data.map((row) => (
          <article key={row.id}>
            <div>
              <strong>{row.title}</strong>
              <p className="whitespace-pre-wrap">{row.text}</p>
            </div>
            <button
              className="icon-button"
              aria-label={`Delete reply ${row.title}`}
              title="Delete saved reply"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Delete this saved reply?')) {
                  setPending(true)
                  void removeSnippet(row.id)
                    .catch((err) => toast.error(asErrorMessage(err)))
                    .finally(() => setPending(false))
                }
              }}
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
