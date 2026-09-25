import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'

export type CallKind = 'voice' | 'video'
export type CallStatus = 'ringing' | 'active' | 'ended'
export type CallScope = {
  clientId: string
  projectId?: string
  conversationId?: string
}
export type CallSession = CallScope & {
  id: string
  createdBy: string
  kind: CallKind
  status: CallStatus
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
  createdAt?: unknown
  updatedAt?: unknown
}
type Unsubscribe = () => void

function requireUser() {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in before starting a call.')
  return user
}

async function requireSupabaseUser() {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) throw new Error('Sign in before starting a call.')
  return data.user
}

function asDescription(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const item = value as { type?: unknown; sdp?: unknown }
  return typeof item.type === 'string' && typeof item.sdp === 'string'
    ? { type: item.type as RTCSdpType, sdp: item.sdp }
    : undefined
}

async function loadSupabaseCall(callId: string): Promise<CallSession | null> {
  const client = getSupabase()
  const [{ data: call, error: callError }, { data: signals, error: signalsError }] = await Promise.all([
    client.from('calls').select('*').eq('id', callId).maybeSingle(),
    client.from('call_signals').select('signal, created_at').eq('call_id', callId).order('created_at', { ascending: true }),
  ])
  if (callError || signalsError) throw callError || signalsError
  if (!call) return null
  const offer = (signals ?? []).map((row) => row.signal).find((signal) => (signal as { type?: string }).type === 'offer') as { data?: unknown } | undefined
  const answer = (signals ?? []).map((row) => row.signal).find((signal) => (signal as { type?: string }).type === 'answer') as { data?: unknown } | undefined
  return {
    id: call.id, clientId: call.client_id, projectId: call.project_id ?? undefined, conversationId: call.conversation_id ?? undefined,
    createdBy: call.created_by, kind: call.kind, status: call.status,
    offer: asDescription(offer?.data), answer: asDescription(answer?.data), createdAt: call.created_at, updatedAt: call.updated_at,
  }
}

function callFromSnapshot(id: string, data: DocumentData) {
  return { id, ...data } as CallSession
}

export async function createCall(scope: CallScope, kind: CallKind) {
  if (backendProvider === 'supabase') {
    const user = await requireSupabaseUser()
    const { data, error } = await getSupabase().from('calls').insert({
      client_id: scope.clientId, project_id: scope.projectId ?? null, conversation_id: scope.conversationId ?? null,
      created_by: user.id, kind, status: 'ringing',
    }).select('id').single()
    if (error || !data) throw error || new Error('Could not start the call.')
    return data.id
  }
  const user = requireUser()
  const reference = await addDoc(collection(getFirebaseDb(), 'calls'), {
    ...scope,
    createdBy: user.uid,
    kind,
    status: 'ringing',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function updateCall(
  callId: string,
  update: Partial<Pick<CallSession, 'offer' | 'answer' | 'status'>>,
) {
  if (backendProvider === 'supabase') {
    const user = await requireSupabaseUser()
    const client = getSupabase()
    if (update.offer) {
      const { error } = await client.from('call_signals').insert({ call_id: callId, sender_id: user.id, signal: { type: 'offer', data: update.offer } })
      if (error) throw error
    }
    if (update.answer) {
      const { error } = await client.from('call_signals').insert({ call_id: callId, sender_id: user.id, signal: { type: 'answer', data: update.answer } })
      if (error) throw error
    }
    if (update.status) {
      const payload = { status: update.status, ...(update.status === 'ended' ? { ended_at: new Date().toISOString() } : {}), ...(update.status === 'active' ? { started_at: new Date().toISOString() } : {}) }
      const { error } = await client.from('calls').update(payload).eq('id', callId)
      if (error) throw error
    }
    return
  }
  requireUser()
  return updateDoc(doc(getFirebaseDb(), 'calls', callId), {
    ...update,
    updatedAt: serverTimestamp(),
  })
}

export function listenToCall(
  callId: string,
  onChange: (call: CallSession | null) => void,
) {
  if (backendProvider === 'supabase') {
    let active = true
    const refresh = () => { void loadSupabaseCall(callId).then((call) => { if (active) onChange(call) }).catch(() => { if (active) onChange(null) }) }
    refresh()
    const channel = getSupabase().channel(`call-${callId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${callId}` }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${callId}` }, refresh)
      .subscribe()
    return () => { active = false; void getSupabase().removeChannel(channel) }
  }
  return onSnapshot(doc(getFirebaseDb(), 'calls', callId), (snapshot) => {
    onChange(
      snapshot.exists() ? callFromSnapshot(snapshot.id, snapshot.data()) : null,
    )
  })
}

export function listenForCalls(
  clientId: string,
  onChange: (calls: CallSession[]) => void,
): Unsubscribe {
  if (backendProvider === 'supabase') {
    let active = true
    const refresh = () => { void getSupabase().from('calls').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(20).then(async ({ data, error }) => {
      if (!active || error) return
      const calls = await Promise.all((data ?? []).map((row) => loadSupabaseCall(row.id)))
      if (active) onChange(calls.filter((call): call is CallSession => Boolean(call)))
    }) }
    refresh()
    const channel = getSupabase().channel(`calls-${clientId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `client_id=eq.${clientId}` }, refresh).subscribe()
    return () => { active = false; void getSupabase().removeChannel(channel) }
  }
  const callQuery = query(
    collection(getFirebaseDb(), 'calls'),
    where('clientId', '==', clientId),
    limit(20),
  )
  return onSnapshot(callQuery, (snapshot) => {
    onChange(snapshot.docs.map((item) => callFromSnapshot(item.id, item.data())))
  })
}

export function listenForCandidates(
  callId: string,
  collectionName: 'offerCandidates' | 'answerCandidates',
  onCandidate: (candidate: RTCIceCandidateInit) => void,
) {
  if (backendProvider === 'supabase') {
    const seen = new Set<string>()
    const refresh = () => { void getSupabase().from('call_signals').select('id, signal').eq('call_id', callId).order('created_at', { ascending: true }).then(({ data }) => {
      for (const row of data ?? []) {
        const signal = row.signal as { type?: string; side?: string; data?: unknown }
        const side = collectionName === 'offerCandidates' ? 'offer' : 'answer'
        if (!seen.has(row.id) && signal.type === 'candidate' && signal.side === side) { seen.add(row.id); onCandidate(signal.data as RTCIceCandidateInit) }
      }
    }) }
    refresh()
    const channel = getSupabase().channel(`call-candidates-${callId}-${collectionName}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${callId}` }, refresh).subscribe()
    return () => { void getSupabase().removeChannel(channel) }
  }
  return onSnapshot(
    collection(getFirebaseDb(), 'calls', callId, collectionName),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') onCandidate(change.doc.data() as RTCIceCandidateInit)
      })
    },
  )
}

export async function addCandidate(
  callId: string,
  collectionName: 'offerCandidates' | 'answerCandidates',
  candidate: RTCIceCandidate,
) {
  if (backendProvider === 'supabase') {
    const user = await requireSupabaseUser()
    const side = collectionName === 'offerCandidates' ? 'offer' : 'answer'
    const data: RTCIceCandidateInit = { candidate: candidate.candidate, sdpMid: candidate.sdpMid || '', sdpMLineIndex: candidate.sdpMLineIndex ?? 0 }
    const { error } = await getSupabase().from('call_signals').insert({ call_id: callId, sender_id: user.id, signal: { type: 'candidate', side, data } })
    if (error) throw error
    return
  }
  requireUser()
  return addDoc(collection(getFirebaseDb(), 'calls', callId, collectionName), {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid || '',
    sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
    createdAt: serverTimestamp(),
  })
}
