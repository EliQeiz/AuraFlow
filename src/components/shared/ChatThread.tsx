import { collection, limitToLast, orderBy, query } from 'firebase/firestore'
import { Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useLiveRows } from '../../hooks/useFirebase'
import { getFirebaseDb } from '../../lib/firebase'
import { backendProvider } from '../../lib/backend'
import { getSupabase } from '../../lib/supabase'
import { sendProjectMessage } from '../../lib/firestore'
import {
  sendSupportMessage,
  startSupportConversation,
} from '../../lib/conversations'
import { asErrorMessage } from '../../lib/utils'
import { uploadPrivateMedia } from '../../lib/media'
import { usePrivateMedia } from '../../hooks/usePrivateMedia'
import { displayDate } from '../../domain/projects'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { StatePanel } from '../ui/StatePanel'
import type { RequestMessage } from '../../types'
import { ReplySnippets } from './AdminOperations'
import { CallPanel } from './CallPanel'
import { VoiceNoteRecorder } from './VoiceNoteRecorder'

function VoiceMessage({ message }: { message: RequestMessage }) {
  const source = usePrivateMedia(message.mediaPath || '')
  const seconds = Math.max(1, Math.round((message.durationMs || 0) / 1000))
  return (
    <div className="voice-message">
      {source ? (
        <audio controls preload="metadata" src={source} aria-label="Voice note" />
      ) : (
        <span className="field-hint">Loading voice note...</span>
      )}
      <span className="voice-message-meta">{seconds}s {message.language ? `· ${message.language}` : ''}</span>
      {message.transcript && (
        <details>
          <summary>Transcript</summary>
          <p>{message.transcript}</p>
        </details>
      )}
    </div>
  )
}

export function ChatThread({
  id,
  title,
  support = false,
  asAdmin = false,
  clientId,
}: {
  id: string
  title: string
  support?: boolean
  asAdmin?: boolean
  clientId?: string
}) {
  const { user, profile } = useAuth()
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(80)
  const [audioPending, setAudioPending] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const log = useRef<HTMLDivElement>(null)
  const supabaseMessages = useQuery({
    queryKey: ['live-chat', 'supabase', user?.uid ?? 'signed-out', support ? 'support' : 'project', id, String(count)],
    queryFn: async () => {
      const table = support ? 'support_messages' : 'project_messages'
      const column = support ? 'conversation_id' : 'project_id'
      const { data, error } = await getSupabase().from(table).select('id, author_id, author_name, role, text, kind, media_path, media_type, duration_ms, transcript, language, created_at').eq(column, id).order('created_at', { ascending: true }).limit(count)
      if (error) throw error
      return (data ?? []).map((message) => ({ id: message.id, authorId: message.author_id, authorName: message.author_name, role: message.role, text: message.text, kind: message.kind, mediaPath: message.media_path ?? undefined, mediaType: message.media_type ?? undefined, durationMs: message.duration_ms ?? undefined, transcript: message.transcript ?? undefined, language: message.language ?? undefined, createdAt: message.created_at }) as RequestMessage)
    },
    enabled: backendProvider === 'supabase' && Boolean(user && id),
    refetchInterval: 5000,
  })
  const firebaseMessages = useLiveRows<RequestMessage>(
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
    backendProvider === 'firebase' && Boolean(user && id),
  )
  const messages = backendProvider === 'supabase'
    ? { ...supabaseMessages, data: supabaseMessages.data ?? ([] as RequestMessage[]) }
    : firebaseMessages
  const lastId = messages.data.at(-1)?.id
  const ownerId = clientId || user?.uid || ''
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
  async function sendVoiceNote(payload: {
    blob: Blob
    durationMs: number
    transcript: string
    language: string
  }) {
    if (!user || audioPending || !ownerId) return
    setError('')
    setAudioPending(true)
    setAudioProgress(0)
    try {
      const extension = payload.blob.type.includes('mp4')
        ? 'm4a'
        : payload.blob.type.includes('ogg')
          ? 'ogg'
          : 'webm'
      const path = `conversations/${ownerId}/media/${Date.now()}-${user.uid}.${extension}`
      await uploadPrivateMedia(
        path,
        new File([payload.blob], `voice-note.${extension}`, {
          type: payload.blob.type || 'audio/webm',
        }),
        setAudioProgress,
      )
      const extra = {
        kind: 'audio' as const,
        mediaPath: path,
        mediaType: payload.blob.type || 'audio/webm',
        durationMs: payload.durationMs,
        transcript: payload.transcript,
        language: payload.language,
      }
      if (support) {
        if (!asAdmin) await startSupportConversation()
        await sendSupportMessage(id, 'Voice note', asAdmin ? 'admin' : 'client', extra)
      } else {
        await sendProjectMessage(id, {
          authorId: user.uid,
          authorName: profile?.name || user.displayName || 'Client',
          text: 'Voice note',
          role: asAdmin ? 'admin' : 'client',
          ...extra,
        })
      }
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setAudioPending(false)
      setAudioProgress(0)
    }
  }
  return (
    <section className="chat-thread">
      <header className="chat-header">
        <div>
          <strong>{title}</strong>
          <p>
            {support
              ? 'A direct conversation with the AuraFlow team'
              : 'Project conversation'}
          </p>
        </div>
        {ownerId && <CallPanel
          scope={support ? { clientId: ownerId, conversationId: id } : { clientId: ownerId, projectId: id }}
          title={title}
          asAdmin={asAdmin}
        />}
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
              {message.kind === 'audio' && message.mediaPath ? (
                <VoiceMessage message={message} />
              ) : (
                <p>{message.text}</p>
              )}
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
        <VoiceNoteRecorder
          disabled={pending || audioPending}
          onRecorded={(payload) => void sendVoiceNote(payload)}
        />
        {audioPending && <span className="upload-progress" role="status">Uploading voice note {audioProgress}%</span>}
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
