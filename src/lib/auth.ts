import {
  GoogleAuthProvider,
  EmailAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  setPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getUserProfile, patchUserProfile, saveUserProfile } from './firestore'
import { getFirebaseAuth, getFirebaseStorage } from './firebase'
import type { UserProfile } from '../types'
import { emailSchema, passwordSchema } from '../domain/auth'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const maxAvatarBytes = 2 * 1024 * 1024
const maxRequestAssetBytes = 50 * 1024 * 1024
const allowedRequestAssetTypes = new Set([
  'application/json',
  'application/msword',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-zip-compressed',
  'application/zip',
  'text/csv',
  'text/plain',
])

export const requestAssetAccept = [
  'image/*',
  'video/*',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.json',
  '.txt',
  '.zip',
].join(',')

function isAllowedRequestAsset(file: File) {
  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('video/') ||
    allowedRequestAssetTypes.has(file.type)
  )
}

function profileFromUser(user: User, fallbackName?: string): UserProfile {
  return {
    uid: user.uid,
    name:
      fallbackName ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'AuraFlow Client',
    email: user.email ?? '',
    plan: 'Starter',
    savedTemplates: [],
    projectCount: 0,
    notifications: true,
  }
}

export async function ensureUserProfile(user: User, fallbackName?: string) {
  try {
    const currentProfile = await getUserProfile(user.uid)
    const profile = profileFromUser(user, fallbackName)

    if (currentProfile) {
      const update: Partial<UserProfile> = {}
      if ((!currentProfile.name || fallbackName) && profile.name)
        update.name = profile.name
      if (!currentProfile.avatarUrl && user.photoURL)
        update.avatarUrl = user.photoURL
      if (Object.keys(update).length) await patchUserProfile(user.uid, update)
      return { ...currentProfile, ...update }
    }

    if (user.photoURL) profile.avatarUrl = user.photoURL
    return await saveUserProfile(profile)
  } catch (error) {
    console.warn(
      'AuraFlow profile sync failed. Auth session remains active.',
      error,
    )
    return null
  }
}

export function shouldUseGoogleRedirect(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''
  return ['auth/popup-blocked', 'auth/cancelled-popup-request'].includes(code)
}

export async function loginWithEmail(
  email: string,
  password: string,
  remember = true,
) {
  const auth = getFirebaseAuth()
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence,
  )
  const credential = await signInWithEmailAndPassword(
    auth,
    emailSchema.parse(email),
    password,
  )
  return credential
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    emailSchema.parse(email),
    passwordSchema.parse(password),
  )
  await updateProfile(credential.user, { displayName: name.trim() })
  void ensureUserProfile(credential.user, name.trim())
  void sendEmailVerification(credential.user).catch(() => undefined)
  return credential
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider)
  return credential
}

export async function loginWithGoogleRedirect() {
  return signInWithRedirect(getFirebaseAuth(), googleProvider)
}

export async function completeGoogleRedirectSignIn() {
  const credential = await getRedirectResult(getFirebaseAuth())
  if (credential?.user) await ensureUserProfile(credential.user)
  return credential
}

export async function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email)
}

export async function logoutAccount() {
  return signOut(getFirebaseAuth())
}

export async function reauthenticateAccount(
  user: User,
  currentPassword?: string,
) {
  if (
    user.providerData.some((provider) => provider.providerId === 'password')
  ) {
    if (!currentPassword || !user.email)
      throw new Error('Enter your current password to confirm this change.')
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, currentPassword),
    )
  } else {
    await reauthenticateWithPopup(user, googleProvider)
  }
}

export async function changePassword(
  user: User,
  password: string,
  currentPassword?: string,
) {
  passwordSchema.parse(password)
  await reauthenticateAccount(user, currentPassword)
  return updatePassword(user, password)
}

export async function uploadAvatar(user: User, file: File) {
  if (!file.type.startsWith('image/'))
    throw new Error('Choose an image file for the avatar.')
  if (file.size > maxAvatarBytes)
    throw new Error('Avatar images must be 2MB or smaller.')

  const extension =
    file.name
      .split('.')
      .pop()
      ?.replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      .slice(0, 8) || 'img'
  const uploadRef = ref(
    getFirebaseStorage(),
    `avatars/${user.uid}/avatar-${Date.now()}.${extension}`,
  )
  await uploadBytes(uploadRef, file)
  const avatarUrl = await getDownloadURL(uploadRef)
  await updateProfile(user, { photoURL: avatarUrl })
  return avatarUrl
}

export async function uploadProjectAsset(
  ownerUid: string,
  projectId: string,
  file: File,
  folder: 'references' | 'previews',
) {
  if (file.size > maxRequestAssetBytes)
    throw new Error('Request files must be 50MB or smaller.')
  if (!isAllowedRequestAsset(file)) {
    throw new Error(
      'Upload an approved reference file: image, video, PDF, Office document, CSV, JSON, text, or ZIP.',
    )
  }

  const extension =
    file.name
      .split('.')
      .pop()
      ?.replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      .slice(0, 8) || 'file'
  const safeBase = (
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9.-]+/gi, '-')
      .slice(0, 80) || 'asset'
  ).replace(/^-+|-+$/g, '')
  const uploadRef = ref(
    getFirebaseStorage(),
    `projects/${ownerUid}/${projectId}/${folder}/${Date.now()}-${safeBase}.${extension}`,
  )
  await uploadBytes(uploadRef, file)

  return {
    name: file.name,
    path: uploadRef.fullPath,
    contentType: file.type,
    url: await getDownloadURL(uploadRef),
  }
}

export async function removeAccount(user: User, currentPassword?: string) {
  await reauthenticateAccount(user, currentPassword)
  return deleteUser(user)
}
