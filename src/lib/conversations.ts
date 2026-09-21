import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { messageText } from '../domain/projects'
import type { RequestMessage } from '../types'

type MessageExtra = Pick<
  RequestMessage,
  'kind' | 'mediaPath' | 'mediaType' | 'durationMs' | 'transcript' | 'language'
>

export async function startSupportConversation() {
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
