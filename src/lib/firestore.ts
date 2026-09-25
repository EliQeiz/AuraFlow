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
import { backendProvider } from './backend'
import { getSupabase } from './supabase'
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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id, email, full_name, phone, plan, saved_templates, project_count, notifications, theme')
      .eq('id', uid)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      uid: data.id,
      name: data.full_name,
      email: data.email,
      phone: data.phone ?? undefined,
      plan: data.plan,
      savedTemplates: data.saved_templates,
      projectCount: data.project_count,
      notifications: data.notifications,
      theme: data.theme ?? undefined,
    } satisfies UserProfile
  }
  const snapshot = await getDoc(doc(getFirebaseDb(), 'users', uid))
  return snapshot.exists() ? ({ ...snapshot.data(), uid } as UserProfile) : null
}

export async function saveUserProfile(profile: UserProfile) {
  if (backendProvider === 'supabase') {
    const existing = await getUserProfile(profile.uid)
    if (existing) return existing
    throw new Error('Profile creation is managed by Supabase Auth.')
  }
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
  if (backendProvider === 'supabase') {
    const payload: Record<string, unknown> = {}
    if (update.name !== undefined) payload.full_name = update.name
    if (update.phone !== undefined) payload.phone = update.phone || null
    if (update.notifications !== undefined) payload.notifications = update.notifications
    if (update.theme !== undefined) payload.theme = update.theme
    if (update.savedTemplates !== undefined) payload.saved_templates = update.savedTemplates
    if (!Object.keys(payload).length) return
    const { error } = await getSupabase().from('profiles').update(payload).eq('id', uid)
    if (error) throw error
    return
  }
  return updateDoc(doc(getFirebaseDb(), 'users', uid), update)
}

type SupabaseProjectRow = Record<string, unknown>
type SupabaseAssetRow = Record<string, unknown>

function mapSupabaseProject(row: SupabaseProjectRow, assets: SupabaseAssetRow[] = []): ProjectRecord {
  const mapAsset = (asset: SupabaseAssetRow): RequestAsset => ({
    id: String(asset.id),
    name: String(asset.name),
    url: '',
    path: String(asset.storage_path),
    contentType: typeof asset.content_type === 'string' ? asset.content_type : undefined,
    kind: asset.kind as RequestAsset['kind'],
    uploadedBy: String(asset.uploaded_by),
    createdAt: asset.created_at,
  })
  return {
    id: String(row.id),
    userId: String(row.user_id),
    clientName: String(row.client_name),
    clientEmail: String(row.client_email),
    title: String(row.title),
    projectType: String(row.project_type),
    description: String(row.description),
    audience: String(row.audience),
    budget: Number(row.budget),
    timeline: String(row.timeline),
    referenceLinks: Array.isArray(row.reference_links) ? row.reference_links.map(String) : [],
    templateSlug: typeof row.template_slug === 'string' ? row.template_slug : undefined,
    solutionSlug: typeof row.solution_slug === 'string' ? row.solution_slug : undefined,
    platformMode: row.platform_mode as ProjectRecord['platformMode'],
    subdomainPreference: typeof row.subdomain_preference === 'string' ? row.subdomain_preference : undefined,
    tenantSlug: typeof row.tenant_slug === 'string' ? row.tenant_slug : undefined,
    stagingUrl: typeof row.staging_url === 'string' ? row.staging_url : undefined,
    productionUrl: typeof row.production_url === 'string' ? row.production_url : undefined,
    prototypeSpec: row.prototype_spec as ProjectRecord['prototypeSpec'],
    design: row.design as ProjectRecord['design'],
    designDraftId: typeof row.design_draft_id === 'string' ? row.design_draft_id : undefined,
    status: row.status as ProjectRecord['status'],
    adminSummary: typeof row.admin_summary === 'string' ? row.admin_summary : undefined,
    lastClientNote: typeof row.last_client_note === 'string' ? row.last_client_note : undefined,
    deadline: typeof row.deadline === 'string' ? row.deadline : undefined,
    assets: assets.filter((asset) => asset.kind !== 'preview').map(mapAsset),
    previews: assets.filter((asset) => asset.kind === 'preview').map(mapAsset),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function loadSupabaseProjectAssets(projectIds: string[]) {
  if (!projectIds.length) return new Map<string, SupabaseAssetRow[]>()
  const { data, error } = await getSupabase()
    .from('project_assets')
    .select('id, project_id, kind, name, storage_path, content_type, uploaded_by, created_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).reduce((grouped, asset) => {
    const key = String(asset.project_id)
    const list = grouped.get(key) ?? []
    list.push(asset)
    grouped.set(key, list)
    return grouped
  }, new Map<string, SupabaseAssetRow[]>())
}

export async function getUserProjects(uid: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as SupabaseProjectRow[]
    const assets = await loadSupabaseProjectAssets(rows.map((row) => String(row.id)))
    return rows.map((row) => mapSupabaseProject(row, assets.get(String(row.id))))
  }
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
  if (backendProvider === 'supabase') {
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user || identity.user.id !== payload.userId)
      throw new Error('Sign in to create a project.')
    const valid = requestSchema.parse(payload)
    const record = {
      ...(requestId ? { id: requestId } : {}),
      user_id: valid.userId,
      client_name: valid.clientName,
      client_email: valid.clientEmail,
      title: valid.title,
      project_type: valid.projectType,
      description: valid.description,
      audience: valid.audience,
      budget: valid.budget,
      timeline: valid.timeline,
      reference_links: valid.referenceLinks,
      template_slug: valid.templateSlug,
      solution_slug: valid.solutionSlug,
      platform_mode: valid.platformMode,
      subdomain_preference: valid.subdomainPreference,
      prototype_spec: valid.prototypeSpec,
      design: valid.design,
      design_draft_id: valid.designDraftId,
    }
    const { data, error } = await getSupabase().from('projects').insert(record).select('id').single()
    if (error) throw error
    return { id: data.id }
  }
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
  if (backendProvider === 'supabase') {
    const { error } = await getSupabase().from('project_assets').insert({
      project_id: projectId,
      kind: asset.kind,
      name: asset.name,
      storage_path: asset.path,
      content_type: asset.contentType,
      uploaded_by: asset.uploadedBy,
    })
    if (error) throw error
    return
  }
  return updateDoc(doc(getFirebaseDb(), 'projects', projectId), {
    assets: arrayUnion(asset),
    updatedAt: serverTimestamp(),
  })
}

export async function requestRevision(projectId: string, note: string) {
  if (backendProvider === 'supabase') {
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user) throw new Error('Sign in to request changes.')
    const text = revisionText.parse(note)
    const client = getSupabase()
    const { error: updateError } = await client
      .from('projects')
      .update({ last_client_note: text })
      .eq('id', projectId)
    if (updateError) throw updateError
    const { error: messageError } = await client.from('project_messages').insert({
      project_id: projectId,
      author_id: identity.user.id,
      author_name: identity.user.user_metadata.full_name || identity.user.email?.split('@')[0] || 'Client',
      role: 'client',
      text: `Revision requested: ${text}`,
    })
    if (messageError) throw messageError
    return
  }
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
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase()
      .from('project_messages')
      .select('id, author_id, author_name, role, text, kind, media_path, media_type, duration_ms, transcript, language, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(80)
    if (error) throw error
    return (data ?? []).map((message) => ({
      id: message.id,
      authorId: message.author_id,
      authorName: message.author_name,
      role: message.role,
      text: message.text,
      kind: message.kind,
      mediaPath: message.media_path ?? undefined,
      mediaType: message.media_type ?? undefined,
      durationMs: message.duration_ms ?? undefined,
      transcript: message.transcript ?? undefined,
      language: message.language ?? undefined,
      createdAt: message.created_at,
    }) as RequestMessage)
  }
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
  if (backendProvider === 'supabase') {
    const { error } = await getSupabase().from('project_messages').insert({
      project_id: projectId,
      author_id: message.authorId,
      author_name: message.authorName,
      role: message.role,
      text: messageText.parse(message.text),
      kind: message.kind ?? 'text',
      media_path: message.mediaPath,
      media_type: message.mediaType,
      duration_ms: message.durationMs,
      transcript: message.transcript,
      language: message.language,
    })
    if (error) throw error
    return
  }
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
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('projects').select('*').order('updated_at', { ascending: false }).limit(80)
    if (error) throw error
    const rows = (data ?? []) as SupabaseProjectRow[]
    const assets = await loadSupabaseProjectAssets(rows.map((row) => String(row.id)))
    return rows.map((row) => mapSupabaseProject(row, assets.get(String(row.id))))
  }
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
  if (backendProvider === 'supabase') {
    const validated = withoutUndefined(adminUpdateSchema.parse(update))
    const payload: Record<string, unknown> = {}
    if (validated.adminSummary !== undefined) payload.admin_summary = validated.adminSummary
    if (validated.deadline !== undefined) payload.deadline = validated.deadline || null
    if (validated.productionUrl !== undefined) payload.production_url = validated.productionUrl || null
    if (validated.stagingUrl !== undefined) payload.staging_url = validated.stagingUrl || null
    if (validated.status !== undefined) payload.status = validated.status
    if (validated.tenantSlug !== undefined) payload.tenant_slug = validated.tenantSlug || null
    const client = getSupabase()
    const { data: actor } = await client.auth.getUser()
    if (!actor.user) throw new Error('Sign in to update a project.')
    const { data: project, error: projectError } = await client.from('projects').select('user_id, title, status').eq('id', projectId).maybeSingle()
    if (projectError || !project) throw new Error('Project not found.')
    const { error } = await client.from('projects').update(payload).eq('id', projectId)
    if (error) throw error
    const { error: eventError } = await client.from('project_events').insert({ project_id: projectId, user_id: project.user_id, actor_id: actor.user.id, entity_id: projectId, kind: 'status', title: project.title, state: validated.status || project.status })
    if (eventError) throw eventError
    return
  }
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
  if (backendProvider === 'supabase') {
    const { error } = await getSupabase().from('project_assets').insert({ project_id: projectId, kind: 'preview', name: preview.name, storage_path: preview.path, content_type: preview.contentType, uploaded_by: preview.uploadedBy })
    if (error) throw error
    return
  }
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
