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
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'

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

function requireUser() {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in before starting a call.')
  return user
}

function callFromSnapshot(id: string, data: DocumentData) {
  return { id, ...data } as CallSession
}

export async function createCall(scope: CallScope, kind: CallKind) {
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

export function updateCall(
  callId: string,
  update: Partial<Pick<CallSession, 'offer' | 'answer' | 'status'>>,
) {
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
  requireUser()
  return addDoc(collection(getFirebaseDb(), 'calls', callId, collectionName), {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid || '',
    sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
    createdAt: serverTimestamp(),
  })
}
