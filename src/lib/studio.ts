import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { draftSchema, type StudioDraft } from '../domain/studio'

export async function saveDraft(
  id: string,
  draft: StudioDraft,
  expectedRevision: number,
) {
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
      transaction.set(
        doc(reference, 'versions', String(currentRevision + 1)),
        snapshot,
      )
      return currentRevision + 1
    },
  )
  return revision
}
