import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'
import { draftSchema, type StudioDraft } from '../domain/studio'

export async function saveDraft(
  id: string,
  draft: StudioDraft,
  expectedRevision: number,
) {
  if (backendProvider === 'supabase') {
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user) throw new Error('Sign in to save your design.')
    const data = draftSchema.parse(draft)
    const client = getSupabase()
    const document = data as unknown as Record<string, unknown>
    const nextRevision = expectedRevision + 1
    if (expectedRevision === 0) {
      const { error } = await client.from('studio_drafts').insert({
        id,
        user_id: identity.user.id,
        suite_slug: data.suiteSlug || 'custom',
        name: data.name,
        document,
        revision: nextRevision,
      })
      if (error) throw error
    } else {
      const { data: updated, error } = await client
        .from('studio_drafts')
        .update({ document, revision: nextRevision })
        .eq('id', id)
        .eq('user_id', identity.user.id)
        .eq('revision', expectedRevision)
        .select('revision')
        .maybeSingle()
      if (error) throw error
      if (!updated)
        throw new Error('This design changed in another tab. Reload it before saving to protect those changes.')
    }
    const { error: versionError } = await client.from('studio_draft_versions').insert({
      draft_id: id,
      revision: nextRevision,
      document,
    })
    if (versionError) throw versionError
    return nextRevision
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to save your design.')
  const data = draftSchema.parse(draft)
  const reference = doc(
    collection(getFirebaseDb(), 'users', user.uid, 'drafts'),
    id,
  )
  const revision = await runTransaction(
    getFirebaseDb(),
    async (transaction) => {
      const previous = await transaction.get(reference)
      const currentRevision = previous.exists()
        ? (previous.data().revision as number)
        : 0
      if (currentRevision !== expectedRevision)
        throw new Error(
          'This design changed in another tab. Reload it before saving to protect those changes.',
        )
      const snapshot = {
        ...data,
        userId: user.uid,
        revision: currentRevision + 1,
        updatedAt: serverTimestamp(),
      }
      transaction.set(reference, snapshot)
      for (let i = 0; i < (data.layers?.length || 0); i += 2) {
        transaction.set(doc(reference, 'layerGroups', String(i / 2)), {
          first: data.layers![i],
          second: data.layers![i + 1] || null,
        })
      }
      transaction.set(
        doc(reference, 'versions', String(currentRevision + 1)),
        snapshot,
      )
      return currentRevision + 1
    },
  )
  return revision
}

export async function getDraft(id: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase()
      .from('studio_drafts')
      .select('document, revision')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Design not found.')
    return {
      draft: draftSchema.parse(data.document),
      revision: data.revision,
    }
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to view your design.')
  const reference = doc(collection(getFirebaseDb(), 'users', user.uid, 'drafts'), id)
  const { getDoc } = await import('firebase/firestore')
  const snapshot = await getDoc(reference)
  if (!snapshot.exists()) throw new Error('Design not found.')
  return { draft: draftSchema.parse(snapshot.data()), revision: Number(snapshot.data().revision || 0) }
}

export async function listDraftVersions(id: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('studio_draft_versions').select('id, revision, document, created_at').eq('draft_id', id).order('revision', { ascending: false }).limit(50)
    if (error) throw error
    return (data ?? []).map((version) => ({
      ...draftSchema.parse(version.document), id: version.id, revision: version.revision, updatedAt: version.created_at,
    }))
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to view your design history.')
  const { getDocs, limit, orderBy, query } = await import('firebase/firestore')
  const reference = collection(getFirebaseDb(), 'users', user.uid, 'drafts', id, 'versions')
  const snapshot = await getDocs(query(reference, orderBy('revision', 'desc'), limit(50)))
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))
}
