import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import {
  addCandidate,
  createCall,
  listenForCalls,
  listenForCandidates,
  listenToCall,
  type CallKind,
  type CallScope,
  type CallSession,
  updateCall,
} from '../../lib/calls'
import { useAuth } from '../../context/AuthContext'

type CallPanelProps = { scope: CallScope; title: string; asAdmin?: boolean }

function serialiseDescription(description: RTCSessionDescription | null) {
  return description ? { type: description.type, sdp: description.sdp } : undefined
}

export function CallPanel({ scope, title, asAdmin = false }: CallPanelProps) {
  const { user } = useAuth()
  const [current, setCurrent] = useState<CallSession | null>(null)
  const [incoming, setIncoming] = useState<CallSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState('')
  const pc = useRef<RTCPeerConnection | null>(null)
  const local = useRef<MediaStream | null>(null)
  const localVideo = useRef<HTMLVideoElement>(null)
  const remote = useRef<HTMLVideoElement>(null)
  const currentId = useRef('')
  const isCaller = useRef(false)
  const stopListeners = useRef<Array<() => void>>([])

  const sameScope = useCallback((call: CallSession) => {
    return call.clientId === scope.clientId
      && call.projectId === scope.projectId
      && call.conversationId === scope.conversationId
  }, [scope.clientId, scope.projectId, scope.conversationId])

  function cleanupMedia() {
    stopListeners.current.forEach((stop) => stop())
    stopListeners.current = []
    pc.current?.close()
    pc.current = null
    local.current?.getTracks().forEach((track) => track.stop())
    local.current = null
    if (localVideo.current) localVideo.current.srcObject = null
    if (remote.current) remote.current.srcObject = null
    currentId.current = ''
    setCurrent(null)
    setMuted(false)
    setCameraOff(false)
  }

  useEffect(() => {
    if (!user) return
    const stop = listenForCalls(scope.clientId, (calls) => {
      const relevant = calls
        .filter((call) => sameScope(call) && call.status === 'ringing')
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      const next = relevant.find((call) => call.createdBy !== user.uid)
      if (next && !currentId.current) setIncoming(next)
    })
    return stop
  }, [scope.clientId, scope.projectId, scope.conversationId, sameScope, user])

  useEffect(() => () => cleanupMedia(), [])

  async function connect(call: CallSession, caller: boolean) {
    if (!user) return
    setError('')
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.kind === 'video',
      })
      const connection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      local.current = media
      pc.current = connection
      currentId.current = call.id
      isCaller.current = caller
      media.getTracks().forEach((track) => connection.addTrack(track, media))
      if (localVideo.current) localVideo.current.srcObject = media
      connection.ontrack = (event) => {
        if (remote.current) remote.current.srcObject = event.streams[0]
      }
      connection.onicecandidate = (event) => {
        if (event.candidate)
          void addCandidate(call.id, caller ? 'offerCandidates' : 'answerCandidates', event.candidate)
      }
      stopListeners.current.push(
        listenForCandidates(call.id, caller ? 'answerCandidates' : 'offerCandidates', (candidate) => {
          void connection.addIceCandidate(candidate)
        }),
        listenToCall(call.id, (next) => {
          if (!next) return
          setCurrent(next)
          if (next.status === 'ended') cleanupMedia()
          if (caller && next.answer && connection.signalingState === 'have-local-offer')
            void connection.setRemoteDescription(next.answer)
        }),
      )
      if (caller) {
        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        await updateCall(call.id, { offer: serialiseDescription(connection.localDescription) })
      } else {
        if (!call.offer) throw new Error('The incoming call offer is no longer available.')
        await connection.setRemoteDescription(call.offer)
        const answer = await connection.createAnswer()
        await connection.setLocalDescription(answer)
        await updateCall(call.id, { answer: serialiseDescription(connection.localDescription), status: 'active' })
      }
    } catch (cause) {
      cleanupMedia()
      setError(cause instanceof Error ? cause.message : 'Could not access the microphone or camera.')
    }
  }

  async function start(kind: CallKind) {
    if (busy || current || !user) return
    setBusy(true)
    try {
      const id = await createCall(scope, kind)
      const call: CallSession = { ...scope, id, createdBy: user.uid, kind, status: 'ringing' }
      setCurrent(call)
      await connect(call, true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the call.')
    } finally {
      setBusy(false)
    }
  }

  async function accept() {
    if (!incoming) return
    const call = incoming
    setIncoming(null)
    setCurrent(call)
    await connect(call, false)
  }

  async function hangUp() {
    const activeCall = current
    if (activeCall) await updateCall(activeCall.id, { status: 'ended' }).catch(() => undefined)
    cleanupMedia()
  }

  function toggleTrack(kind: 'audio' | 'video') {
    const track = local.current?.getTracks().find((item) => item.kind === kind)
    if (!track) return
    track.enabled = !track.enabled
    if (kind === 'audio') setMuted(!track.enabled)
    else setCameraOff(!track.enabled)
  }

  return (
    <>
      <div className="call-actions" aria-label="Call actions">
        <button type="button" className="icon-button" title="Start voice call" aria-label={`Start voice call with ${title}`} disabled={busy || Boolean(current)} onClick={() => void start('voice')}><Phone /></button>
        <button type="button" className="icon-button" title="Start video call" aria-label={`Start video call with ${title}`} disabled={busy || Boolean(current)} onClick={() => void start('video')}><Video /></button>
      </div>
      {incoming && <div className="incoming-call" role="alert"><PhoneCall size={16} /><span><strong>{title}</strong> is calling</span><Button onClick={() => void accept()}><Phone /> Answer</Button><button type="button" className="icon-button" aria-label="Decline call" title="Decline call" onClick={() => { void updateCall(incoming.id, { status: 'ended' }); setIncoming(null) }}><X /></button></div>}
      {current && <div className="call-panel" role="dialog" aria-label={`${current.kind} call with ${title}`}>
        <div className="call-panel-header"><div><span className="call-live-dot" />{current.status === 'active' ? 'Connected' : 'Calling'} · {title}</div><button type="button" className="icon-button" aria-label="Close call panel" title="Close call panel" onClick={() => void hangUp()}><X /></button></div>
        <video ref={remote} className="call-remote" autoPlay playsInline aria-label="Remote call video" />
        {current.kind === 'video' && <video className="call-local" ref={localVideo} muted autoPlay playsInline aria-label="Your camera preview" />}
        <div className="call-controls">
          <button type="button" className="icon-button" aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute microphone' : 'Mute microphone'} onClick={() => toggleTrack('audio')}>{muted ? <MicOff /> : <Mic />}</button>
          {current.kind === 'video' && <button type="button" className="icon-button" aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'} title={cameraOff ? 'Turn camera on' : 'Turn camera off'} onClick={() => toggleTrack('video')}>{cameraOff ? <CameraOff /> : <Camera />}</button>}
          <button type="button" className="icon-button call-hangup" aria-label="End call" title="End call" onClick={() => void hangUp()}><PhoneOff /></button>
        </div>
      </div>}
      {error && <p className="call-error" role="alert">{error}</p>}
      <span className="sr-only">{asAdmin ? 'Admin call controls' : 'Client call controls'}</span>
    </>
  )
}
