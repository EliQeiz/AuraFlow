import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { privateMediaBlob } from '../lib/media'

export function usePrivateMedia(path?: string) {
  const { user } = useAuth()
  const [result, setResult] = useState<{
    path: string
    uid: string
    url: string
  }>({ path: '', uid: '', url: '' })
  useEffect(() => {
    if (!path || !user) return
    let active = true
    let url = ''
    void privateMediaBlob(path)
      .then((blob) => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setResult({ path, uid: user.uid, url })
      })
      .catch(() => {
        if (active) setResult({ path, uid: user.uid, url: '' })
      })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [path, user])
  return result.path === path && result.uid === user?.uid ? result.url : ''
}
