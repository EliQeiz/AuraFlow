import { collection, limit, orderBy, query } from 'firebase/firestore'
import {
  Check,
  CheckCheck,
  Circle,
  ExternalLink,
  GitPullRequest,
  Plus,
  Send,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import { createWork, respondToWork } from '../../lib/workflow'
import { asErrorMessage } from '../../lib/utils'
import {
  canTransition,
  type WorkItem,
  type WorkState,
  type WorkInput,
} from '../../domain/workflow'
import type { ProjectRecord } from '../../types'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Input, Select, Textarea } from '../ui/Input'
import { StatePanel } from '../ui/StatePanel'
import { displayDate } from '../../domain/projects'

const labels = {
  milestone: 'Milestones',
  review: 'Approvals',
  change: 'Change requests',
}
export function ProjectWorkflow({
  project,
  asAdmin = false,
}: {
  project: ProjectRecord
  asAdmin?: boolean
}) {
  const { user } = useAuth()
  const rows = useLiveRows<WorkItem>(
    ['work-items', user!.uid, project.id],
    () =>
      query(
        collection(getFirebaseDb(), 'projects', project.id, 'workItems'),
        orderBy('createdAt', 'desc'),
        limit(100),
      ),
  )
  const [params] = useSearchParams()
  const [kind, setKind] = useState<WorkInput['kind']>(() => {
    const value = params.get('kind')
    return value === 'review' || value === 'change' ? value : 'milestone'
  })
  const [composer, setComposer] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget,
      data = new FormData(form)
    setPending(true)
    setError('')
    try {
      await createWork(project, {
        kind: asAdmin
          ? (String(data.get('kind')) as WorkInput['kind'])
          : 'change',
        title: String(data.get('title')),
        details: String(data.get('details')),
        dueDate: String(data.get('dueDate') || ''),
        assignedTo: String(
          data.get('assignedTo') || 'team',
        ) as WorkInput['assignedTo'],
        url: String(data.get('url') || ''),
      })
      setKind(
        asAdmin ? (String(data.get('kind')) as WorkInput['kind']) : 'change',
      )
      setComposer(false)
      toast.success('Added to the project workflow.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  const items = rows.data.filter((item) => item.kind === kind)
  const milestones = rows.data.filter((item) => item.kind === 'milestone')
  return (
    <section className="workflow-section">
      <header className="section-heading">
        <div>
          <span className="workspace-label">Delivery workspace</span>
          <h2>From brief to sign-off</h2>
        </div>
        <Button variant="secondary" onClick={() => setComposer(!composer)}>
          <Plus />
          {asAdmin ? 'Add deliverable' : 'New change request'}
        </Button>
      </header>
      {milestones.length > 0 && (
        <div className="workflow-progress">
          <div>
            <span>Milestones completed</span>
            <strong>
              {milestones.filter((i) => i.state === 'done').length} /{' '}
              {milestones.length}
            </strong>
          </div>
          <progress
            aria-label="Milestone completion"
            value={milestones.filter((i) => i.state === 'done').length}
            max={milestones.length}
          />
        </div>
      )}
      {composer && (
        <form className="workflow-composer request-form" onSubmit={create}>
          {asAdmin && (
            <Field label="Deliverable type">
              <Select name="kind">
                <option value="milestone">Milestone</option>
                <option value="review">Approval request (new version)</option>
              </Select>
            </Field>
          )}
          <Field label="Title">
            <Input
              name="title"
              required
              minLength={3}
              maxLength={160}
              placeholder={
                asAdmin
                  ? 'Homepage design - version 1'
                  : 'Update the booking form'
              }
            />
          </Field>
          <Field label="Details">
            <Textarea name="details" maxLength={4000} />
          </Field>
          {asAdmin && (
            <div className="form-pair">
              <Field label="Due date">
                <Input name="dueDate" type="date" />
              </Field>
              <Field label="Milestone owner">
                <Select name="assignedTo">
                  <option value="team">AuraFlow team</option>
                  <option value="client">Client</option>
                </Select>
              </Field>
            </div>
          )}
          <Field label="Reference or version preview URL">
            <Input name="url" type="url" placeholder="https://" />
          </Field>
          {error && (
            <p role="alert" className="inline-alert error">
              {error}
            </p>
          )}
          <div className="page-actions">
            <Button type="submit" loading={pending}>
              <Send />
              Publish
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setComposer(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="tab-bar" role="tablist" aria-label="Delivery workflow">
        {(Object.keys(labels) as WorkInput['kind'][]).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
          >
            {labels[value]}
            <span className="count-badge">
              {rows.data.filter((item) => item.kind === value).length}
            </span>
          </button>
        ))}
      </div>
      {rows.isPending ? (
        <StatePanel loading />
      ) : rows.error ? (
        <StatePanel error={rows.error} retry={() => void rows.refetch()} />
      ) : !items.length ? (
        <StatePanel
          title={`No ${labels[kind].toLowerCase()} yet`}
          description={
            kind === 'review'
              ? 'Each published version keeps its own decision and feedback.'
              : kind === 'change'
                ? 'Scope adjustments and their decisions are tracked here.'
                : 'Your team will publish delivery steps and due dates here.'
          }
        />
      ) : (
        <div className="work-list">
          {items.map((item) => (
            <WorkRow
              key={item.id}
              item={item}
              project={project}
              asAdmin={asAdmin}
            />
          ))}
        </div>
      )}
      {rows.data.length === 100 && (
        <p className="field-hint">Showing the latest 100 workflow items.</p>
      )}
    </section>
  )
}
function WorkRow({
  item,
  project,
  asAdmin,
}: {
  item: WorkItem
  project: ProjectRecord
  asAdmin: boolean
}) {
  const [feedback, setFeedback] = useState(''),
    [pending, setPending] = useState(false),
    [error, setError] = useState('')
  const actions: { state: WorkState; label: string }[] = [
    { state: 'done', label: 'Complete' },
    { state: 'open', label: 'Reopen' },
    { state: 'approved', label: 'Approve version' },
    { state: 'changes-requested', label: 'Request changes' },
    { state: 'accepted', label: 'Accept request' },
    { state: 'declined', label: 'Decline request' },
  ]
  const available = actions.filter((a) => canTransition(item, a.state, asAdmin))
  async function respond(state: WorkState) {
    setPending(true)
    setError('')
    try {
      await respondToWork(project, item.id, state, feedback, asAdmin)
      setFeedback('')
      toast.success('Decision recorded.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  const overdue =
    item.dueDate &&
    item.dueDate < new Date().toISOString().slice(0, 10) &&
    item.state === 'open'
  return (
    <article className="work-row">
      <div className="work-row-icon">
        {item.kind === 'review' ? (
          <CheckCheck />
        ) : item.kind === 'change' ? (
          <GitPullRequest />
        ) : item.state === 'done' ? (
          <Check />
        ) : (
          <Circle />
        )}
      </div>
      <div className="work-row-body">
        <div className="section-heading">
          <h3>{item.title}</h3>
          <span className="status" data-state={item.state}>
            {item.state.replaceAll('-', ' ')}
          </span>
        </div>
        <p className="work-description">{item.details}</p>
        <div className="work-meta">
          <span>
            {item.assignedTo === 'client' ? 'Client' : 'AuraFlow team'}
          </span>
          <time>{displayDate(item.createdAt)}</time>
          {item.dueDate && (
            <span className={overdue ? 'text-red-400' : ''}>
              {overdue ? 'Overdue' : 'Due'} {item.dueDate}
            </span>
          )}
        </div>
        {item.url && /^https:\/\//i.test(item.url) && (
          <a
            className="inline-link"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            Open reference <ExternalLink size={13} />
          </a>
        )}
        {item.response && (
          <blockquote className="decision-note">{item.response}</blockquote>
        )}
        {available.length > 0 && (
          <div className="work-response">
            {item.kind !== 'milestone' && (
              <Textarea
                aria-label={`Feedback for ${item.title}`}
                placeholder="Feedback or decision notes..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={4000}
              />
            )}
            <div className="page-actions">
              {available.map((action) => (
                <Button
                  key={action.state}
                  variant={
                    action.state === 'declined' ||
                    action.state === 'changes-requested'
                      ? 'ghost'
                      : 'secondary'
                  }
                  disabled={pending}
                  onClick={() => void respond(action.state)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p className="inline-alert error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}
