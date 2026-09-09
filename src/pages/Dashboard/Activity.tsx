import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import { asErrorMessage } from '../../lib/utils'
import { displayDate } from '../../domain/projects'
import type { ProjectEvent } from '../../domain/workflow'
import { Button } from '../../components/ui/Button'
import { StatePanel } from '../../components/ui/StatePanel'

export default function Activity() {
  const { user, admin } = useAuth()
  const [unreadOnly, setUnreadOnly] = useState(false),
    [pending, setPending] = useState(false)
  const events = useLiveRows<ProjectEvent>(
    ['activity', user!.uid, String(admin)],
    () =>
      query(
        collection(getFirebaseDb(), 'projectEvents'),
        ...(!admin ? [where('userId', '==', user!.uid)] : []),
        orderBy('createdAt', 'desc'),
        limit(100),
      ),
  )
  const reads = useLiveRows<{ id: string }>(['activity-reads', user!.uid], () =>
    query(
      collection(getFirebaseDb(), 'users', user!.uid, 'eventReads'),
      orderBy('readAt', 'desc'),
      limit(500),
    ),
  )
  const read = new Set(reads.data.map((row) => row.id))
  const unread = events.data.filter((event) => !read.has(event.id))
  async function mark(ids: string[]) {
    setPending(true)
    try {
      const batch = writeBatch(getFirebaseDb())
      ids.forEach((id) =>
        batch.set(doc(getFirebaseDb(), 'users', user!.uid, 'eventReads', id), {
          readAt: serverTimestamp(),
        }),
      )
      await batch.commit()
    } catch (err) {
      toast.error(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <span className="workspace-label">Project activity</span>
          <h1>Inbox</h1>
          <p>Milestones, decisions, scope changes, and delivery updates.</p>
        </div>
        <Button
          variant="secondary"
          loading={pending}
          disabled={!unread.length}
          onClick={() => void mark(unread.map((event) => event.id))}
        >
          <CheckCheck />
          Mark all read
        </Button>
      </div>
      <div className="tab-bar" role="tablist" aria-label="Inbox filter">
        {[false, true].map((value) => (
          <button
            key={String(value)}
            role="tab"
            aria-selected={unreadOnly === value}
            onClick={() => setUnreadOnly(value)}
          >
            {value ? `Unread (${unread.length})` : 'All activity'}
          </button>
        ))}
      </div>
      {events.isPending || reads.isPending ? (
        <StatePanel loading />
      ) : events.error || reads.error ? (
        <StatePanel
          error={events.error || reads.error}
          retry={() => {
            void events.refetch()
            void reads.refetch()
          }}
        />
      ) : (
        <div className="activity-list">
          {(unreadOnly ? unread : events.data).map((event) => (
            <article key={event.id} data-unread={!read.has(event.id)}>
              <Bell size={18} />
              <div>
                <Link
                  to={
                    admin
                      ? `/dashboard/admin?project=${encodeURIComponent(event.projectId)}&view=${event.kind === 'status' ? 'delivery' : 'workflow'}&kind=${encodeURIComponent(event.kind)}`
                      : `/dashboard/requests/${encodeURIComponent(event.projectId)}?view=workflow&kind=${encodeURIComponent(event.kind)}`
                  }
                >
                  {event.title}
                </Link>
                <p>
                  {event.kind} · {event.state.replaceAll('-', ' ')} ·{' '}
                  {event.actorId === user!.uid ? 'You' : 'Project update'}
                </p>
                <time>{displayDate(event.createdAt)}</time>
              </div>
              {!read.has(event.id) && (
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => void mark([event.id])}
                >
                  Mark read
                </Button>
              )}
            </article>
          ))}
          {!(unreadOnly ? unread : events.data).length && (
            <StatePanel
              title={unreadOnly ? 'You are all caught up' : 'No activity yet'}
              description="New delivery activity will appear here."
            />
          )}
        </div>
      )}
      <p className="field-hint mt-5">
        Latest 100 project events. Conversations are in Messages.
      </p>
    </>
  )
}
