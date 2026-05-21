import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import type { BlogPost, ContactPayload, ProjectRecord, QuotePayload, UserProfile } from '../types'

export async function submitContact(payload: ContactPayload) {
  return addDoc(collection(getFirebaseDb(), 'contacts'), { ...payload, createdAt: serverTimestamp() })
}

export async function submitQuote(payload: QuotePayload) {
  return addDoc(collection(getFirebaseDb(), 'quotes'), { ...payload, createdAt: serverTimestamp() })
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
  const projectQuery = query(collection(getFirebaseDb(), 'projects'), where('userId', '==', uid))
  const snapshot = await getDocs(projectQuery)
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ProjectRecord)
}
