import { getBlob, ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseAuth, getFirebaseStorage } from './firebase'

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
  return getBlob(ref(getFirebaseStorage(), path), 50 * 1024 * 1024)
}
