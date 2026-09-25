import { getBlob, ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseAuth, getFirebaseStorage } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'

export const rasterTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]
const mediaTypes = [
  ...rasterTypes,
  'video/mp4',
  'video/webm',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]
export function validateMedia(file: File, imageOnly = false) {
  if (file.size === 0 || file.size > 50 * 1024 * 1024)
    throw new Error('Choose a non-empty file up to 50 MB.')
  if (!(imageOnly ? rasterTypes : mediaTypes).includes(file.type))
    throw new Error(
      imageOnly
        ? 'Choose a JPEG, PNG, WebP, AVIF, or GIF image.'
        : 'Choose an image, MP4/WebM video, voice note, PDF, document, spreadsheet, ZIP, or text file.',
    )
}
export async function uploadPrivateMedia(
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  validateMedia(file)
  if (backendProvider === 'supabase') {
    const target = supabaseStorageTarget(path)
    const { data: identity, error: identityError } = await getSupabase().auth.getUser()
    if (identityError || !identity.user) throw new Error('Sign in before uploading files.')
    if (!target.path.startsWith(`${identity.user.id}/`)) {
      const { data: role, error: roleError } = await getSupabase().from('user_roles').select('role').eq('user_id', identity.user.id).maybeSingle()
      if (roleError || role?.role !== 'admin') throw new Error('You can only upload to your private workspace.')
    }
    const { error } = await getSupabase().storage.from(target.bucket).upload(target.path, file, {
      contentType: file.type,
      cacheControl: 'private, max-age=0',
      upsert: false,
    })
    if (error) throw error
    onProgress?.(100)
    return target.path
  }
  if (!getFirebaseAuth().currentUser)
    throw new Error('Sign in before uploading files.')
  const upload = uploadBytesResumable(ref(getFirebaseStorage(), path), file, {
    contentType: file.type,
    cacheControl: 'private,max-age=0',
  })
  await new Promise<void>((resolve, reject) =>
    upload.on(
      'state_changed',
      (snapshot) =>
        onProgress?.(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        ),
      reject,
      resolve,
    ),
  )
  return path
}
export function privateMediaBlob(path: string) {
  if (backendProvider === 'supabase') {
    const target = supabaseStorageTarget(path)
    return getSupabase().storage.from(target.bucket).download(target.path).then(({ data, error }) => {
      if (error) throw error
      if (!data) throw new Error('Private file was not found.')
      return data
    })
  }
  return getBlob(ref(getFirebaseStorage(), path), 50 * 1024 * 1024)
}

function supabaseStorageTarget(path: string) {
  const segments = path.split('/').filter(Boolean)
  if (segments[0] === 'projects' && segments.length >= 3)
    return { bucket: 'project-assets', path: segments.slice(1).join('/') }
  if (segments[0] === 'users' && segments.length >= 3)
    return { bucket: 'studio-assets', path: segments.slice(1).join('/') }
  if (segments[0] === 'conversations' && segments.length >= 3)
    return { bucket: 'conversation-media', path: segments.slice(1).join('/') }
  // Project metadata stores the normalized path because its bucket is implied
  // by the table. Legacy callers still pass the Firebase-style prefix above.
  if (segments.length >= 2)
    return { bucket: 'project-assets', path: segments.join('/') }
  throw new Error('Unsupported private storage path.')
}
