import { useState, type FormEvent } from 'react'
import { Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { attachProjectAsset } from '../../lib/firestore'
import { uploadPrivateMedia, validateMedia } from '../../lib/media'
import { asErrorMessage } from '../../lib/utils'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function ProjectFileUploader({
  projectId,
  count,
  onUploaded,
}: {
  projectId: string
  count: number
  onUploaded: () => void
}) {
  const { user } = useAuth()
  const [selection, setSelection] = useState<{ file: File; id: string } | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selection || !user || pending) return
    const form = event.currentTarget
    setPending(true)
    setError('')
    try {
      const { file, id } = selection
      const path = `projects/${user.uid}/${projectId}/references/${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100)}`
      await uploadPrivateMedia(path, file, setProgress)
      await attachProjectAsset(projectId, {
        id,
        name: file.name,
        path,
        url: '',
        contentType: file.type,
        kind: 'reference',
        uploadedBy: user.uid,
      })
      setSelection(null)
      form.reset()
      onUploaded()
      toast.success('File added to your project.')
    } catch (err) {
      setError(asErrorMessage(err))
    } finally {
      setPending(false)
    }
  }
  return (
    <form
      className="request-form mb-6 border-b border-[var(--line)] pb-6"
      onSubmit={submit}
    >
      <Field
        label="Add a project file"
        hint={`${count}/32 files. Images, videos, documents, or ZIP files up to 50 MB each.`}
      >
        <Input
          type="file"
          disabled={pending || count >= 32}
          onChange={(event) => {
            setError('')
            setSelection(null)
            const file = event.target.files?.[0]
            if (!file) return
            try {
              validateMedia(file)
              setSelection({ file, id: crypto.randomUUID() })
            } catch (err) {
              setError(asErrorMessage(err))
            }
          }}
        />
      </Field>
      {error && (
        <p className="inline-alert error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="field-hint">
          Uploading {progress}%
        </p>
      )}
      <Button
        type="submit"
        variant="secondary"
        className="justify-self-start"
        disabled={!selection || count >= 32}
        loading={pending}
      >
        <Upload />
        {error && selection ? 'Retry upload' : 'Upload file'}
      </Button>
    </form>
  )
}
