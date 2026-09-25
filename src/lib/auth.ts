import {
  GoogleAuthProvider, EmailAuthProvider, browserLocalPersistence,
  browserSessionPersistence, reauthenticateWithCredential, reauthenticateWithPopup,
  sendEmailVerification, setPersistence, createUserWithEmailAndPassword, deleteUser,
  getRedirectResult, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, signOut, updatePassword, updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getUserProfile, patchUserProfile, saveUserProfile } from './firestore'
import { getFirebaseAuth, getFirebaseStorage } from './firebase'
import { backendProvider } from './backend'
import {
  getSupabaseProfile, supabaseChangePassword, supabaseLoginWithEmail,
  supabaseLoginWithGoogle, supabaseRegisterWithEmail, supabaseRequestPasswordReset,
  supabaseSignOut, supabaseUploadAvatar, toSupabaseAuraUser, type SupabaseAuraUser,
} from './supabase-auth'
import { getSupabase } from './supabase'
import type { UserProfile } from '../types'
import { emailSchema, passwordSchema } from '../domain/auth'

export type AuraUser = FirebaseUser | SupabaseAuraUser

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
const maxAvatarBytes = 2 * 1024 * 1024
const maxRequestAssetBytes = 50 * 1024 * 1024
const allowedRequestAssetTypes = new Set([
  'application/json', 'application/msword', 'application/pdf',
  'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-zip-compressed', 'application/zip', 'text/csv', 'text/plain',
])

export const requestAssetAccept = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.json', '.txt', '.zip'].join(',')

function isAllowedRequestAsset(file: File) {
  return file.type.startsWith('image/') || file.type.startsWith('video/') || allowedRequestAssetTypes.has(file.type)
}

function profileFromUser(user: AuraUser, fallbackName?: string): UserProfile {
  return {
    uid: user.uid,
    name: fallbackName || user.displayName || user.email?.split('@')[0] || 'AuraFlow Client',
    email: user.email ?? '', plan: 'Starter', savedTemplates: [], projectCount: 0, notifications: true,
  }
}

export async function ensureUserProfile(user: AuraUser, fallbackName?: string) {
  if (backendProvider === 'supabase') return getSupabaseProfile(user as SupabaseAuraUser)
  try {
    const currentProfile = await getUserProfile(user.uid)
    const profile = profileFromUser(user, fallbackName)
    if (currentProfile) {
      const update: Partial<UserProfile> = {}
      if ((!currentProfile.name || fallbackName) && profile.name) update.name = profile.name
      if (!currentProfile.avatarUrl && user.photoURL) update.avatarUrl = user.photoURL
      if (Object.keys(update).length) await patchUserProfile(user.uid, update)
      return { ...currentProfile, ...update }
    }
    if (user.photoURL) profile.avatarUrl = user.photoURL
    return await saveUserProfile(profile)
  } catch (error) {
    console.warn('AuraFlow profile sync failed. Auth session remains active.', error)
    return null
  }
}

export function shouldUseGoogleRedirect(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : ''
  return ['auth/popup-blocked', 'auth/cancelled-popup-request'].includes(code)
}

export async function loginWithEmail(email: string, password: string, remember = true) {
  if (backendProvider === 'supabase') return supabaseLoginWithEmail(email, password)
  const auth = getFirebaseAuth()
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  return signInWithEmailAndPassword(auth, emailSchema.parse(email), password)
}

export async function registerWithEmail(name: string, email: string, password: string) {
  if (backendProvider === 'supabase') return supabaseRegisterWithEmail(name, email, password)
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), emailSchema.parse(email), passwordSchema.parse(password))
  await updateProfile(credential.user, { displayName: name.trim() })
  void ensureUserProfile(credential.user, name.trim())
  void sendEmailVerification(credential.user).catch(() => undefined)
  return credential
}

export async function loginWithGoogle() {
  if (backendProvider === 'supabase') return supabaseLoginWithGoogle()
  return signInWithPopup(getFirebaseAuth(), googleProvider)
}

export async function loginWithGoogleRedirect() {
  if (backendProvider === 'supabase') return supabaseLoginWithGoogle()
  return signInWithRedirect(getFirebaseAuth(), googleProvider)
}

export async function completeGoogleRedirectSignIn() {
  if (backendProvider === 'supabase') return null
  const credential = await getRedirectResult(getFirebaseAuth())
  if (credential?.user) await ensureUserProfile(credential.user)
  return credential
}

export async function requestPasswordReset(email: string) {
  if (backendProvider === 'supabase') return supabaseRequestPasswordReset(email)
  return sendPasswordResetEmail(getFirebaseAuth(), email)
}

export async function logoutAccount() {
  if (backendProvider === 'supabase') return supabaseSignOut()
  return signOut(getFirebaseAuth())
}

export async function reauthenticateAccount(user: AuraUser, currentPassword?: string) {
  if (backendProvider === 'supabase') return
  const firebaseUser = user as FirebaseUser
  if (firebaseUser.providerData.some((provider) => provider.providerId === 'password')) {
    if (!currentPassword || !firebaseUser.email) throw new Error('Enter your current password to confirm this change.')
    await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, currentPassword))
  } else await reauthenticateWithPopup(firebaseUser, googleProvider)
}

export async function changePassword(user: AuraUser, password: string, currentPassword?: string) {
  if (backendProvider === 'supabase') return supabaseChangePassword(password, currentPassword)
  passwordSchema.parse(password)
  await reauthenticateAccount(user, currentPassword)
  return updatePassword(user as FirebaseUser, password)
}

export async function uploadAvatar(user: AuraUser, file: File) {
  if (backendProvider === 'supabase') return supabaseUploadAvatar(user as SupabaseAuraUser, file)
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file for the avatar.')
  if (file.size > maxAvatarBytes) throw new Error('Avatar images must be 2MB or smaller.')
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'img'
  const uploadRef = ref(getFirebaseStorage(), `avatars/${user.uid}/avatar-${Date.now()}.${extension}`)
  await uploadBytes(uploadRef, file)
  const avatarUrl = await getDownloadURL(uploadRef)
  await updateProfile(user as FirebaseUser, { photoURL: avatarUrl })
  return avatarUrl
}

export async function uploadProjectAsset(ownerUid: string, projectId: string, file: File, folder: 'references' | 'previews') {
  if (file.size > maxRequestAssetBytes) throw new Error('Request files must be 50MB or smaller.')
  if (!isAllowedRequestAsset(file)) throw new Error('Upload an approved reference file: image, video, PDF, Office document, CSV, JSON, text, or ZIP.')
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'file'
  const safeBase = (file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9.-]+/gi, '-').slice(0, 80) || 'asset').replace(/^-+|-+$/g, '')
  const path = `${ownerUid}/${projectId}/${folder}/${Date.now()}-${safeBase}.${extension}`
  if (backendProvider === 'supabase') {
    const client = getSupabase()
    const { error } = await client.storage.from('project-assets').upload(path, file, { contentType: file.type })
    if (error) throw error
    const signed = await client.storage.from('project-assets').createSignedUrl(path, 60 * 30)
    if (signed.error) throw signed.error
    return { name: file.name, path, contentType: file.type, url: signed.data.signedUrl }
  }
  const uploadRef = ref(getFirebaseStorage(), `projects/${path}`)
  await uploadBytes(uploadRef, file)
  return { name: file.name, path: uploadRef.fullPath, contentType: file.type, url: await getDownloadURL(uploadRef) }
}

export async function removeAccount(user: AuraUser, currentPassword?: string) {
  if (backendProvider === 'supabase') throw new Error('Account deletion is handled by AuraFlow support after identity verification.')
  await reauthenticateAccount(user, currentPassword)
  return deleteUser(user as FirebaseUser)
}

export async function sendAccountVerification(user: AuraUser) {
  if (backendProvider === 'supabase') {
    if (!user.email) throw new Error('This account does not have an email address.')
    const { error } = await getSupabase().auth.resend({ type: 'signup', email: user.email })
    if (error) throw error
    return
  }
  return sendEmailVerification(user as FirebaseUser)
}

export async function refreshAccountUser() {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().auth.getUser()
    if (error) throw error
    return data.user ? toSupabaseAuraUser(data.user) : null
  }
  const user = getFirebaseAuth().currentUser
  if (!user) return null
  await user.reload()
  return user
}
