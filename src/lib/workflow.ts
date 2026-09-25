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
import { backendProvider } from './backend'
import { getSupabase } from './supabase'
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
async function supabaseActor() {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) throw new Error('Sign in to continue.')
  return data.user
}
const dbKind = (kind: WorkInput['kind']) => kind === 'milestone' ? 'deliverable' : kind
const uiKind = (kind: string): WorkInput['kind'] => kind === 'deliverable' ? 'milestone' : kind as WorkInput['kind']
const dbState = (state: WorkState) => (Object.assign({} as Record<WorkState, string>, { done: 'completed', 'changes-requested': 'returned', declined: 'cancelled' })[state] || state)
const uiState = (state: string): WorkState => (({ completed: 'done', returned: 'changes-requested', cancelled: 'declined' } as Record<string, WorkState>)[state] || state) as WorkState
const dbAssignee = (value: WorkInput['assignedTo']) => value === 'team' ? 'admin' : value
const uiAssignee = (value: string): WorkInput['assignedTo'] => value === 'admin' ? 'team' : 'client'

export async function listProjectWork(projectId: string): Promise<WorkItem[]> {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('project_work_items').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return (data ?? []).map((item) => ({ id: item.id, kind: uiKind(item.kind), title: item.title, details: item.details, dueDate: item.due_date ?? '', assignedTo: uiAssignee(item.assigned_to), url: item.url ?? '', state: uiState(item.state), response: item.response, authorId: item.author_id, updatedBy: item.updated_by, lastEventId: item.last_event_id ?? '', createdAt: item.created_at, updatedAt: item.updated_at }))
  }
  throw new Error('Live workflow queries are handled by Firebase.')
}
export async function createWork(project: ProjectRecord, input: WorkInput) {
  if (backendProvider === 'supabase') {
    const user = await supabaseActor(), data = workSchema.parse(input), client = getSupabase()
    const { data: item, error } = await client.from('project_work_items').insert({ project_id: project.id, kind: dbKind(data.kind), title: data.title, details: data.details, due_date: data.dueDate || null, assigned_to: dbAssignee(data.assignedTo), url: data.url || null, state: 'open', response: '', author_id: user.id, updated_by: user.id }).select('id').single()
    if (error || !item) throw error || new Error('Could not create this workflow item.')
    const { error: eventError } = await client.from('project_events').insert({ project_id: project.id, user_id: project.userId, actor_id: user.id, entity_id: item.id, kind: data.kind, title: data.title, state: 'open' })
    if (eventError) throw eventError
    return
  }
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
  if (backendProvider === 'supabase') {
    const user = await supabaseActor(), client = getSupabase()
    if (response.trim().length > 4000) throw new Error('Keep feedback under 4,000 characters.')
    if (['changes-requested', 'declined'].includes(next) && response.trim().length < 3) throw new Error('Add a short explanation before continuing.')
    const { data: item, error } = await client.from('project_work_items').select('*').eq('id', id).eq('project_id', project.id).maybeSingle()
    if (error || !item) throw new Error('This item has changed. Refresh before responding.')
    const mapped: WorkItem = { id: item.id, kind: uiKind(item.kind), title: item.title, details: item.details, dueDate: item.due_date ?? '', assignedTo: uiAssignee(item.assigned_to), url: item.url ?? '', state: uiState(item.state), response: item.response, authorId: item.author_id, updatedBy: item.updated_by, lastEventId: item.last_event_id ?? '' }
    if (!canTransition(mapped, next, admin)) throw new Error('This item has changed. Refresh before responding.')
    const { data: updated, error: updateError } = await client.from('project_work_items').update({ state: dbState(next), response: response.trim(), updated_by: user.id }).eq('id', id).select('id').maybeSingle()
    if (updateError || !updated) throw new Error('This item has changed. Refresh before responding.')
    const { error: eventError } = await client.from('project_events').insert({ project_id: project.id, user_id: project.userId, actor_id: user.id, entity_id: id, kind: mapped.kind, title: mapped.title, state: next })
    if (eventError) throw eventError
    return
  }
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
  if (backendProvider === 'supabase') {
    const user = await supabaseActor(), client = getSupabase()
    if (!projects.length || projects.length > 5) throw new Error('Select between one and five projects per update.')
    for (const project of projects) {
      const { error } = await client.from('projects').update({ status }).eq('id', project.id)
      if (error) throw error
      const { error: eventError } = await client.from('project_events').insert({ project_id: project.id, user_id: project.userId, actor_id: user.id, entity_id: project.id, kind: 'status', title: project.title, state: status })
      if (eventError) throw eventError
    }
    return
  }
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
  if (backendProvider === 'supabase') {
    const user = await supabaseActor()
    const { error } = await getSupabase().from('project_operations').upsert({ project_id: projectId, priority: prioritySchema.parse(priority), updated_by: user.id })
    if (error) throw error
    return
  }
  await setDoc(doc(getFirebaseDb(), 'projectOps', projectId), {
    priority: prioritySchema.parse(priority),
    updatedBy: actor().uid,
    updatedAt: serverTimestamp(),
  })
}
export async function addInternalNote(projectId: string, text: string) {
  if (text.trim().length < 3 || text.length > 4000)
    throw new Error('Notes must contain 3 to 4,000 characters.')
  if (backendProvider === 'supabase') {
    const user = await supabaseActor()
    const { error } = await getSupabase().from('project_internal_notes').insert({ project_id: projectId, author_id: user.id, text: text.trim() })
    if (error) throw error
    return
  }
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
  if (backendProvider === 'supabase') {
    const user = await supabaseActor()
    const { error } = await getSupabase().from('user_snippets').insert({ user_id: user.id, title: title.trim(), text: text.trim() })
    if (error) throw error
    return
  }
  await addDoc(collection(getFirebaseDb(), 'users', actor().uid, 'snippets'), {
    title: title.trim(),
    text: text.trim(),
  })
}
export async function removeSnippet(id: string) {
  if (backendProvider === 'supabase') {
    const { error } = await getSupabase().from('user_snippets').delete().eq('id', id)
    if (error) throw error
    return
  }
  await deleteDoc(doc(getFirebaseDb(), 'users', actor().uid, 'snippets', id))
}
