import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import type {
  BlogPost,
  ContactPayload,
  ProjectRecord,
  ProjectRequestRecord,
  QuotePayload,
  RequestAsset,
  RequestMessage,
  RequestStatus,
  UserProfile,
} from '../types'

function withoutUndefined<T extends object>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>
}

export async function submitContact(payload: ContactPayload) {
  return addDoc(collection(getFirebaseDb(), 'contacts'), { ...withoutUndefined(payload), createdAt: serverTimestamp() })
}

export async function submitQuote(payload: QuotePayload) {
  return addDoc(collection(getFirebaseDb(), 'quotes'), { ...withoutUndefined(payload), createdAt: serverTimestamp() })
}

export async function subscribeEmail(email: string) {
  return addDoc(collection(getFirebaseDb(), 'newsletter'), { email, createdAt: serverTimestamp() })
}

export async function getBlogPosts() {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'blog'), orderBy('publishedAt', 'desc')))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as BlogPost)
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'users', uid))
  return snapshot.exists() ? ({ ...snapshot.data(), uid } as UserProfile) : null
}

export async function saveUserProfile(profile: UserProfile) {
  return setDoc(doc(getFirebaseDb(), 'users', profile.uid), profile, { merge: true })
}

export async function patchUserProfile(uid: string, update: Partial<UserProfile>) {
  return updateDoc(doc(getFirebaseDb(), 'users', uid), update)
}

export async function getUserProjects(uid: string) {
  const projectQuery = query(collection(getFirebaseDb(), 'projects'), where('userId', '==', uid), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(projectQuery)
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ProjectRecord)
}

export async function createProjectRequest(payload: Omit<ProjectRequestRecord, 'id' | 'assets' | 'previews' | 'status' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(getFirebaseDb(), 'projects'), {
    ...withoutUndefined(payload),
    assets: [],
    previews: [],
    status: 'Submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function attachProjectAsset(projectId: string, asset: RequestAsset) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    assets: arrayUnion(asset),
    updatedAt: serverTimestamp(),
  })
}

export async function requestRevision(projectId: string, note: string) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    lastClientNote: note,
    status: 'Review',
    updatedAt: serverTimestamp(),
  })
}

export async function getProjectMessages(projectId: string) {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'projects', projectId, 'messages'), orderBy('createdAt', 'asc'), limit(80)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RequestMessage)
}

export async function sendProjectMessage(projectId: string, message: Omit<RequestMessage, 'id' | 'createdAt'>) {
  return addDoc(collection(getFirebaseDb(), 'projects', projectId, 'messages'), { ...message, createdAt: serverTimestamp() })
}

export async function getAdminProjects() {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), 'projects'), orderBy('updatedAt', 'desc'), limit(80)))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ProjectRequestRecord)
}

export async function updateAdminProject(projectId: string, update: { adminSummary?: string; deadline?: string; status?: RequestStatus }) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), { ...withoutUndefined(update), updatedAt: serverTimestamp() })
}

export async function attachProjectPreview(projectId: string, preview: RequestAsset) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    previews: arrayUnion(preview),
    updatedAt: serverTimestamp(),
  })
}

export async function getAdminMessages() {
  const snapshot = await getDocs(query(collectionGroup(getFirebaseDb(), 'messages'), orderBy('createdAt', 'desc'), limit(120)))
  return snapshot.docs.map((item) => ({ projectId: item.ref.parent.parent?.id ?? '', ...item.data(), id: item.id }) as RequestMessage & { projectId: string })
}
