import { collection, limitToLast, orderBy, query } from 'firebase/firestore'
import { Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import { sendProjectMessage } from '../../lib/firestore'
import {
  sendSupportMessage,
  startSupportConversation,
} from '../../lib/conversations'
import { asErrorMessage } from '../../lib/utils'
import { displayDate } from '../../domain/projects'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { StatePanel } from '../ui/StatePanel'
import type { RequestMessage } from '../../types'
import { ReplySnippets } from './AdminOperations'

export function ChatThread({
  id,
  title,
  support = false,
  asAdmin = false,
}: {
  id: string
  title: string
  support?: boolean
  asAdmin?: boolean
}) {
  const { user, profile } = useAuth()
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(80)
  const log = useRef<HTMLDivElement>(null)
  const messages = useLiveRows<RequestMessage>(
    [
      'live-chat',
      user!.uid,
      support ? 'support' : 'project',
      id,
      String(count),
    ],
    () =>
      query(
        collection(
          getFirebaseDb(),
          support ? 'conversations' : 'projects',
          id,
          'messages',
        ),
        orderBy('createdAt', 'asc'),
        limitToLast(count),
      ),
  )
  const lastId = messages.data.at(-1)?.id
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [lastId])
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || pending) return
    setError('')
    setPending(true)
    try {
      if (support) {
        if (!asAdmin) await startSupportConversation()
        await sendSupportMessage(id, text, asAdmin ? 'admin' : 'client')
      } else
        await sendProjectMessage(id, {
          authorId: user.uid,
          authorName: profile?.name || user.displayName || 'Client',
          text,
          role: asAdmin ? 'admin' : 'client',
        })
      setText('')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="chat-thread">
      <header className="chat-header">
        <strong>{title}</strong>
        <p>
          {support
            ? 'A direct conversation with the AuraFlow team'
            : 'Project conversation'}
        </p>
      </header>
      <div
        ref={log}
        className="chat-log"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
      >
        {messages.data.length >= count && (
          <Button
            variant="ghost"
            onClick={() => setCount((value) => value + 80)}
          >
            Load earlier messages
          </Button>
        )}
        {messages.isPending ? (
          <StatePanel loading />
        ) : messages.error ? (
          <StatePanel
            error={messages.error}
            retry={() => void messages.refetch()}
          />
        ) : !messages.data.length ? (
          <StatePanel
            title="How can we help?"
            description="Ask a question or share what you have in mind. Our team will reply here."
          />
        ) : (
          messages.data.map((message) => (
            <article
              key={message.id}
              className={`message ${message.authorId === user?.uid ? 'message-own' : ''}`}
            >
              <div className="message-meta">
                <span>
                  {message.role === 'admin'
                    ? 'AuraFlow team'
                    : message.authorName}
                </span>
                <time>{displayDate(message.createdAt)}</time>
              </div>
              <p>{message.text}</p>
            </article>
          ))
        )}
      </div>
      {error && (
        <p className="inline-alert error mx-4" role="alert">
          {error}
        </p>
      )}
      <form className="chat-compose" onSubmit={send}>
        {asAdmin && <ReplySnippets onInsert={setText} />}
        <Textarea
          aria-label="Your message"
          placeholder="Write a message..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          minLength={2}
          maxLength={4000}
          required
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
              event.currentTarget.form?.requestSubmit()
          }}
        />
        <Button
          type="submit"
          loading={pending}
          disabled={text.trim().length < 2}
        >
          <Send />
          Send
        </Button>
      </form>
    </section>
  )
}
