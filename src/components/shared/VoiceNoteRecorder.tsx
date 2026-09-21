import { Mic, Square, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<{ 0?: { transcript: string } }> }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function makeRecorder(stream: MediaStream) {
  if (typeof MediaRecorder === 'undefined')
    throw new Error('Voice notes are not supported by this browser.')
  const preferred = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg']
  const mimeType = preferred.find((type) => MediaRecorder.isTypeSupported(type))
  return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
}

export function VoiceNoteRecorder({
  onRecorded,
  disabled = false,
}: {
  onRecorded: (payload: { blob: Blob; durationMs: number; transcript: string; language: string }) => void
  disabled?: boolean
}) {
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const chunks = useRef<Blob[]>([])
  const startedAt = useRef(0)
  const transcriptRef = useRef('')
  const cancelled = useRef(false)
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en-GH')

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop())
    recognition.current?.stop()
  }, [])
  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setDuration(Date.now() - startedAt.current), 250)
    return () => window.clearInterval(timer)
  }, [recording])

  async function start() {
    setError('')
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const nextRecorder = makeRecorder(nextStream)
      if (!nextRecorder) throw new Error('This browser cannot create a supported voice note.')
      stream.current = nextStream
      recorder.current = nextRecorder
      chunks.current = []
      cancelled.current = false
      setTranscript('')
      transcriptRef.current = ''
      setDuration(0)
      startedAt.current = Date.now()
      nextRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data)
      }
      nextRecorder.onstop = () => {
        if (!cancelled.current) {
          const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || 'audio/webm' })
          const durationMs = Math.max(500, Date.now() - startedAt.current)
          onRecorded({ blob, durationMs, transcript: transcriptRef.current.trim(), language })
        }
        nextStream.getTracks().forEach((track) => track.stop())
        stream.current = null
      }
      const Recognition = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
        || (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
      if (Recognition) {
        const nextRecognition = new Recognition()
        nextRecognition.lang = language
        nextRecognition.continuous = true
        nextRecognition.interimResults = true
        nextRecognition.onresult = (event) => {
          const words = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ')
          transcriptRef.current = words
          setTranscript(words)
        }
        nextRecognition.onerror = () => undefined
        recognition.current = nextRecognition
        nextRecognition.start()
      }
      nextRecorder.start(250)
      setRecording(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Microphone access was not available.')
    }
  }

  function stop() {
    recorder.current?.stop()
    recognition.current?.stop()
    recognition.current = null
    recorder.current = null
    setRecording(false)
  }

  return (
    <div className="voice-note-recorder">
      <select aria-label="Voice note language" value={language} disabled={recording || disabled} onChange={(event) => setLanguage(event.target.value)}>
        <option value="en-GH">English (Ghana)</option>
        <option value="en-US">English (US)</option>
        <option value="fr-FR">French</option>
      </select>
      {recording ? (
        <Button type="button" variant="danger" onClick={stop}><Square /> Stop {Math.floor(duration / 1000)}s</Button>
      ) : (
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => void start()}><Mic /> Voice note</Button>
      )}
      {transcript && <span className="voice-note-transcript" title="Speech recognition preview">{transcript}</span>}
      {error && <span className="voice-note-error" role="alert">{error}</span>}
      {recording && <button type="button" className="icon-button" title="Cancel voice note" aria-label="Cancel voice note" onClick={() => { cancelled.current = true; recorder.current?.stop(); recognition.current?.stop(); recorder.current = null; setRecording(false); setTranscript('') }}><Trash2 /></button>}
    </div>
  )
}
