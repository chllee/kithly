import { useState } from 'react'
import exifr from 'exifr'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function MediaUpload({ eventId, onUploaded }) {
  const { session } = useAuth()
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)

    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${eventId}/${crypto.randomUUID()}.${ext}`
    const type = file.type.startsWith('image/') ? 'photo' : 'video'

    let taken_at = null
    let latitude = null
    let longitude = null

    if (type === 'photo') {
      try {
        const exif = await exifr.parse(file, { gps: true, DateTimeOriginal: true })
        taken_at = exif?.DateTimeOriginal?.toISOString() ?? null
        latitude = exif?.latitude ?? null
        longitude = exif?.longitude ?? null
      } catch {}
    }

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setLoading(false)
      return
    }

    const mediaId = crypto.randomUUID()

    const { error: insertError } = await supabase.from('media').insert({
      id: mediaId,
      event_id: eventId,
      uploaded_by: session.user.id,
      type,
      storage_path: path,
      caption: caption.trim() || null,
      taken_at,
      latitude,
      longitude,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Kick off AI processing in the background — don't block the UI on it
    if (type === 'photo') {
      fetch('http://localhost:3001/process-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      }).catch(() => {})
    }

    setFile(null)
    setCaption('')
    onUploaded()

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={e => setFile(e.target.files[0] ?? null)}
        required
      />
      <input
        placeholder="Caption (optional)"
        value={caption}
        onChange={e => setCaption(e.target.value)}
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading || !file}>
        {loading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
