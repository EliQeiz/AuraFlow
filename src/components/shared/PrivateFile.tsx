import { Download, File, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { privateMediaBlob } from '../../lib/media'
import { asErrorMessage } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { RequestAsset } from '../../types'

export function PrivateFile({ asset }: { asset: RequestAsset }) {
  const [loading, setLoading] = useState(false)
  async function download() {
    setLoading(true)
    try {
      if (!asset.path)
        throw new Error(
          'This older file needs to be reattached by AuraFlow. Please contact us in Messages.',
        )
      const blob = await privateMediaBlob(asset.path)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = asset.name
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      toast.error(asErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="file-row">
      <File size={17} />
      <span title={asset.name}>{asset.name}</span>
      <button
        className="icon-button"
        aria-label={`Download ${asset.name}`}
        title="Download file"
        disabled={loading}
        onClick={download}
      >
        {loading ? <LoaderCircle className="animate-spin" /> : <Download />}
      </button>
    </div>
  )
}
