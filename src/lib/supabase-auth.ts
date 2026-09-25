import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import { emailSchema, passwordSchema } from '../domain/auth'
import { getSupabase } from './supabase'

export interface SupabaseAuraUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  providerData: Array<{ providerId: string }>
}

export function toSupabaseAuraUser(user: User): SupabaseAuraUser {
  const metadata = user.user_metadata
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      metadata.full_name ?? metadata.name ?? user.email?.split('@')[0] ?? null,
    photoURL: metadata.avatar_url ?? metadata.picture ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    providerData: user.identities?.map((identity) => ({
      providerId: identity.provider,
    })) ?? [],
  }
}

function profileFromUser(user: SupabaseAuraUser): UserProfile {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'AuraFlow Client',
    email: user.email || '',
    plan: 'Starter',
    savedTemplates: [],
    projectCount: 0,
    notifications: true,
  }
}

export async function getSupabaseProfile(user: SupabaseAuraUser) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select(
      'id, email, full_name, phone, avatar_path, plan, saved_templates, project_count, notifications, theme',
    )
    .eq('id', user.uid)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  let avatarUrl: string | undefined
  if (data.avatar_path) {
    const signed = await getSupabase()
      .storage
      .from('avatars')
      .createSignedUrl(data.avatar_path, 60 * 30)
    if (!signed.error) avatarUrl = signed.data.signedUrl
  }

  return {
    ...profileFromUser(user),
    uid: data.id,
    email: data.email,
    name: data.full_name,
    phone: data.phone ?? undefined,
    avatarUrl,
    plan: data.plan,
    savedTemplates: data.saved_templates,
    projectCount: data.project_count,
    notifications: data.notifications,
    theme: data.theme ?? undefined,
  } satisfies UserProfile
}

export async function supabaseLoginWithEmail(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: emailSchema.parse(email),
    password,
  })
  if (error) throw error
  return data
}

export async function supabaseRegisterWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const { data, error } = await getSupabase().auth.signUp({
    email: emailSchema.parse(email),
    password: passwordSchema.parse(password),
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })
  if (error) throw error
  return data
}

export async function supabaseLoginWithGoogle() {
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login`,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
  return data
}

export async function supabaseRequestPasswordReset(email: string) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(
    emailSchema.parse(email),
    { redirectTo: `${window.location.origin}/login?recovery=1` },
  )
  if (error) throw error
}

export async function supabaseSignOut() {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw error
}

export async function supabaseChangePassword(
  password: string,
  currentPassword?: string,
) {
  const client = getSupabase()
  const { data: identity, error: identityError } = await client.auth.getUser()
  if (identityError || !identity.user?.email) throw new Error('Sign in again to update your password.')
  const usesPassword = identity.user.identities?.some(
    (identityRecord) => identityRecord.provider === 'email',
  )
  if (usesPassword) {
    if (!currentPassword) throw new Error('Enter your current password to confirm this change.')
    const { error } = await client.auth.signInWithPassword({
      email: identity.user.email,
      password: currentPassword,
    })
    if (error) throw new Error('Your current password is incorrect.')
  }
  const { error } = await client.auth.updateUser({
    password: passwordSchema.parse(password),
  })
  if (error) throw error
}

export async function supabaseUploadAvatar(user: SupabaseAuraUser, file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file for the avatar.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Avatar images must be 2MB or smaller.')

  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'img'
  const path = `${user.uid}/avatar-${Date.now()}.${extension}`
  const client = getSupabase()
  const { error: uploadError } = await client.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { error: profileError } = await client
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', user.uid)
  if (profileError) throw profileError

  const { error: authError } = await client.auth.updateUser({
    data: { avatar_path: path },
  })
  if (authError) throw authError

  const signed = await client.storage.from('avatars').createSignedUrl(path, 60 * 30)
  if (signed.error) throw signed.error
  return signed.data.signedUrl
}
