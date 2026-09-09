import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import {
  adminUpdateSchema,
  messageText,
  requestSchema,
  revisionText,
} from '../domain/projects'
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
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

export async function submitContact(payload: ContactPayload) {
  return addDoc(collection(getFirebaseDb(), 'contacts'), {
    ...withoutUndefined(payload),
    createdAt: serverTimestamp(),
  })
}

export async function submitQuote(payload: QuotePayload) {
  return addDoc(collection(getFirebaseDb(), 'quotes'), {
    ...withoutUndefined(payload),
    createdAt: serverTimestamp(),
  })
}

export async function subscribeEmail(email: string) {
  return addDoc(collection(getFirebaseDb(), 'newsletter'), {
    email,
    createdAt: serverTimestamp(),
  })
}

export async function getBlogPosts() {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'blog'), orderBy('publishedAt', 'desc')),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as BlogPost,
  )
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'users', uid))
  return snapshot.exists() ? ({ ...snapshot.data(), uid } as UserProfile) : null
}

export async function saveUserProfile(profile: UserProfile) {
  const reference = doc(getFirebaseDb(), 'users', profile.uid)
  return runTransaction(getFirebaseDb(), async (transaction) => {
    const existing = await transaction.get(reference)
    if (existing.exists())
      return { ...existing.data(), uid: profile.uid } as UserProfile
    transaction.set(reference, profile)
    return profile
  })
}

export async function patchUserProfile(
  uid: string,
  update: Partial<UserProfile>,
) {
  return updateDoc(doc(getFirebaseDb(), 'users', uid), update)
}

export async function getUserProjects(uid: string) {
  const projectQuery = query(
    collection(getFirebaseDb(), 'projects'),
    where('userId', '==', uid),
    orderBy('updatedAt', 'desc'),
  )
  const snapshot = await getDocs(projectQuery)
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as ProjectRecord,
  )
}

export async function createProjectRequest(
  payload: Omit<
    ProjectRequestRecord,
    'id' | 'assets' | 'previews' | 'status' | 'createdAt' | 'updatedAt'
  >,
  requestId?: string,
) {
  const identity = getFirebaseAuth().currentUser
  if (!identity || identity.uid !== payload.userId)
    throw new Error('Sign in to create a project.')
  const valid = requestSchema.parse(payload)
  const reference = requestId
    ? doc(getFirebaseDb(), 'projects', requestId)
    : doc(collection(getFirebaseDb(), 'projects'))
  await runTransaction(getFirebaseDb(), async (transaction) => {
    const existing = await transaction.get(reference)
    if (existing.exists()) return
    transaction.set(reference, {
      ...withoutUndefined(valid),
      assets: [],
      previews: [],
      status: 'Submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  return reference
}

export async function attachProjectAsset(
  projectId: string,
  asset: RequestAsset,
) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    assets: arrayUnion(asset),
    updatedAt: serverTimestamp(),
  })
}

export async function requestRevision(projectId: string, note: string) {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to request changes.')
  const text = revisionText.parse(note)
  const batch = writeBatch(getFirebaseDb())
  batch.update(doc(getFirebaseDb(), 'projects', projectId), {
    lastClientNote: text,
    status: 'Review',
    updatedAt: serverTimestamp(),
  })
  batch.set(
    doc(collection(getFirebaseDb(), 'projects', projectId, 'messages')),
    {
      authorId: user.uid,
      authorName: user.displayName || 'Client',
      role: 'client',
      text: `Revision requested: ${text}`,
      createdAt: serverTimestamp(),
    },
  )
  return batch.commit()
}

export async function getProjectMessages(projectId: string) {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), 'projects', projectId, 'messages'),
      orderBy('createdAt', 'asc'),
      limitToLast(80),
    ),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as RequestMessage,
  )
}

export async function sendProjectMessage(
  projectId: string,
  message: Omit<RequestMessage, 'id' | 'createdAt'>,
) {
  return addDoc(
    collection(getFirebaseDb(), 'projects', projectId, 'messages'),
    {
      ...message,
      text: messageText.parse(message.text),
      createdAt: serverTimestamp(),
    },
  )
}

export async function getAdminProjects() {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), 'projects'),
      orderBy('updatedAt', 'desc'),
      limit(80),
    ),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as ProjectRequestRecord,
  )
}

export async function updateAdminProject(
  projectId: string,
  update: {
    adminSummary?: string
    deadline?: string
    productionUrl?: string
    stagingUrl?: string
    status?: RequestStatus
    tenantSlug?: string
  },
) {
  const db = getFirebaseDb(),
    user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to update a project.')
  const validated = withoutUndefined(adminUpdateSchema.parse(update))
  return runTransaction(db, async (tx) => {
    const reference = doc(db, 'projects', projectId)
    const snapshot = await tx.get(reference)
    if (!snapshot.exists()) throw new Error('Project not found.')
    const event = doc(collection(db, 'projectEvents'))
    tx.update(reference, {
      ...validated,
      updatedAt: serverTimestamp(),
      lastEventId: event.id,
    })
    tx.set(event, {
      projectId,
      userId: snapshot.data().userId,
      actorId: user.uid,
      entityId: projectId,
      kind: 'status',
      title: snapshot.data().title,
      state: validated.status || snapshot.data().status,
      createdAt: serverTimestamp(),
    })
  })
}

export async function attachProjectPreview(
  projectId: string,
  preview: RequestAsset,
) {
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    previews: arrayUnion(preview),
    updatedAt: serverTimestamp(),
  })
}

export async function getAdminMessages() {
  const snapshot = await getDocs(
    query(
      collectionGroup(getFirebaseDb(), 'messages'),
      orderBy('createdAt', 'desc'),
      limit(120),
    ),
  )
  return snapshot.docs.map(
    (item) =>
      ({
        projectId: item.ref.parent.parent?.id ?? '',
        ...item.data(),
        id: item.id,
      }) as RequestMessage & { projectId: string },
  )
}
