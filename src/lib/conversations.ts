import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'
import { messageText } from '../domain/projects'
import type { RequestMessage } from '../types'

type MessageExtra = Pick<
  RequestMessage,
  'kind' | 'mediaPath' | 'mediaType' | 'durationMs' | 'transcript' | 'language'
>

export async function startSupportConversation() {
  if (backendProvider === 'supabase') {
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user) throw new Error('Sign in to contact AuraFlow.')
    const { error } = await getSupabase().from('support_conversations').upsert({
      id: identity.user.id,
      user_id: identity.user.id,
      name: identity.user.user_metadata.full_name || identity.user.email?.split('@')[0] || 'Client',
    })
    if (error) throw error
    return identity.user.id
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to contact AuraFlow.')
  await setDoc(
    doc(getFirebaseDb(), 'conversations', user.uid),
    {
      userId: user.uid,
      name: user.displayName || 'Client',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  return user.uid
}
export async function sendSupportMessage(
  conversationId: string,
  text: string,
  role: 'client' | 'admin',
  extra: MessageExtra = {},
) {
  if (backendProvider === 'supabase') {
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user) throw new Error('Sign in to send a message.')
    const { error } = await getSupabase().from('support_messages').insert({
      conversation_id: conversationId,
      author_id: identity.user.id,
      author_name: identity.user.user_metadata.full_name || (role === 'admin' ? 'AuraFlow' : 'Client'),
      role,
      text: messageText.parse(text),
      kind: extra.kind ?? 'text',
      media_path: extra.mediaPath,
      media_type: extra.mediaType,
      duration_ms: extra.durationMs,
      transcript: extra.transcript,
      language: extra.language,
    })
    if (error) throw error
    return
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to send a message.')
  return addDoc(
    collection(getFirebaseDb(), 'conversations', conversationId, 'messages'),
    {
      authorId: user.uid,
      authorName:
        user.displayName || (role === 'admin' ? 'AuraFlow' : 'Client'),
      role,
      ...extra,
      text: messageText.parse(text),
      createdAt: serverTimestamp(),
    },
  )
}
