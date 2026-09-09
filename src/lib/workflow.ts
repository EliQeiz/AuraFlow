import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  writeBatch,
  setDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import {
  canTransition,
  prioritySchema,
  workSchema,
  type WorkInput,
  type WorkItem,
  type WorkState,
} from '../domain/workflow'
import type { ProjectRecord, RequestStatus } from '../types'

function actor() {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to continue.')
  return user
}
export async function createWork(project: ProjectRecord, input: WorkInput) {
  const user = actor(),
    db = getFirebaseDb(),
    data = workSchema.parse(input)
  const item = doc(collection(db, 'projects', project.id, 'workItems'))
  const event = doc(collection(db, 'projectEvents'))
  const batch = writeBatch(db)
  batch.set(item, {
    ...data,
    state: 'open',
    response: '',
    authorId: user.uid,
    updatedBy: user.uid,
    lastEventId: event.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(event, {
    projectId: project.id,
    userId: project.userId,
    actorId: user.uid,
    entityId: item.id,
    kind: data.kind,
    title: data.title,
    state: 'open',
    createdAt: serverTimestamp(),
  })
  await batch.commit()
}
export async function respondToWork(
  project: ProjectRecord,
  id: string,
  next: WorkState,
  response: string,
  admin: boolean,
) {
  const user = actor(),
    db = getFirebaseDb()
  if (response.trim().length > 4000)
    throw new Error('Keep feedback under 4,000 characters.')
  if (
    ['changes-requested', 'declined'].includes(next) &&
    response.trim().length < 3
  )
    throw new Error('Add a short explanation before continuing.')
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'projects', project.id, 'workItems', id)
    const snapshot = await tx.get(ref)
    if (
      !snapshot.exists() ||
      !canTransition(snapshot.data() as WorkItem, next, admin)
    )
      throw new Error('This item has changed. Refresh before responding.')
    const event = doc(collection(db, 'projectEvents'))
    tx.update(ref, {
      state: next,
      response: response.trim(),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
      lastEventId: event.id,
    })
    tx.set(event, {
      projectId: project.id,
      userId: project.userId,
      actorId: user.uid,
      entityId: id,
      kind: snapshot.data().kind,
      title: snapshot.data().title,
      state: next,
      createdAt: serverTimestamp(),
    })
  })
}
export async function bulkStatus(
  projects: ProjectRecord[],
  status: RequestStatus,
) {
  const user = actor(),
    db = getFirebaseDb()
  if (!projects.length || projects.length > 5)
    throw new Error('Select between one and five projects per update.')
  const batch = writeBatch(db)
  for (const project of projects) {
    const event = doc(collection(db, 'projectEvents'))
    batch.update(doc(db, 'projects', project.id), {
      status,
      updatedAt: serverTimestamp(),
      lastEventId: event.id,
    })
    batch.set(event, {
      projectId: project.id,
      userId: project.userId,
      actorId: user.uid,
      entityId: project.id,
      kind: 'status',
      title: project.title,
      state: status,
      createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
export async function setPriority(projectId: string, priority: string) {
  await setDoc(doc(getFirebaseDb(), 'projectOps', projectId), {
    priority: prioritySchema.parse(priority),
    updatedBy: actor().uid,
    updatedAt: serverTimestamp(),
  })
}
export async function addInternalNote(projectId: string, text: string) {
  if (text.trim().length < 3 || text.length > 4000)
    throw new Error('Notes must contain 3 to 4,000 characters.')
  await addDoc(
    collection(getFirebaseDb(), 'projects', projectId, 'internalNotes'),
    { text: text.trim(), authorId: actor().uid, createdAt: serverTimestamp() },
  )
}
export async function saveSnippet(title: string, text: string) {
  if (
    title.trim().length < 2 ||
    title.length > 80 ||
    text.trim().length < 2 ||
    text.length > 4000
  )
    throw new Error(
      'Add a title (2-80 characters) and reply (2-4,000 characters).',
    )
  await addDoc(collection(getFirebaseDb(), 'users', actor().uid, 'snippets'), {
    title: title.trim(),
    text: text.trim(),
  })
}
export async function removeSnippet(id: string) {
  await deleteDoc(doc(getFirebaseDb(), 'users', actor().uid, 'snippets', id))
}
