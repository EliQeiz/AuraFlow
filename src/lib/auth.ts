import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getUserProfile, patchUserProfile, saveUserProfile } from './firestore'
import { getFirebaseAuth, getFirebaseStorage } from './firebase'
import type { UserProfile } from '../types'

const googleProvider = new GoogleAuthProvider()
const maxAvatarBytes = 2 * 1024 * 1024

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password)
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  await updateProfile(credential.user, { displayName: name })
  await saveUserProfile({
    uid: credential.user.uid,
    name,
    email,
    plan: 'Starter',
    savedTemplates: [],
    projectCount: 0,
    notifications: true,
  })
  return credential
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider)
  const currentProfile = await getUserProfile(credential.user.uid)

  if (currentProfile) {
    const update: Partial<UserProfile> = {}
    if (!currentProfile.name && credential.user.displayName) update.name = credential.user.displayName
    if (!currentProfile.avatarUrl && credential.user.photoURL) update.avatarUrl = credential.user.photoURL
    if (Object.keys(update).length) await patchUserProfile(credential.user.uid, update)
  } else {
    const profile: UserProfile = {
      uid: credential.user.uid,
      name: credential.user.displayName ?? 'AuraFlow Client',
      email: credential.user.email ?? '',
      plan: 'Starter',
      savedTemplates: [],
      projectCount: 0,
      notifications: true,
    }
    if (credential.user.photoURL) profile.avatarUrl = credential.user.photoURL
    await saveUserProfile(profile)
  }

  return credential
}

export async function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email)
}

export async function logoutAccount() {
  return signOut(getFirebaseAuth())
}

export async function changePassword(user: User, password: string) {
  return updatePassword(user, password)
}

export async function uploadAvatar(user: User, file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file for the avatar.')
  if (file.size > maxAvatarBytes) throw new Error('Avatar images must be 2MB or smaller.')

  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'img'
  const uploadRef = ref(getFirebaseStorage(), `avatars/${user.uid}/avatar-${Date.now()}.${extension}`)
  await uploadBytes(uploadRef, file)
  const avatarUrl = await getDownloadURL(uploadRef)
  await updateProfile(user, { photoURL: avatarUrl })
  return avatarUrl
}

export async function removeAccount(user: User) {
  return deleteUser(user)
}
