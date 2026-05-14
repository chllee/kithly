import { useState } from 'react'
import styled from 'styled-components'
import { Upload, ImagePlus } from 'lucide-react'
import exifr from 'exifr'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Input, PrimaryButton, ErrorMsg, GlassCard } from './ui'

const UploadCard = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const FileLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 12px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bg};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg { width: 18px; height: 18px; flex-shrink: 0; }

  input { display: none; }
`

const FileName = styled.span`
  color: ${({ theme }) => theme.colors.textDark};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
`

const FormRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;
  flex-wrap: wrap;
`

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

    let taken_at = null, latitude = null, longitude = null
    if (type === 'photo') {
      try {
        const exif = await exifr.parse(file, { gps: true, DateTimeOriginal: true })
        taken_at = exif?.DateTimeOriginal?.toISOString() ?? null
        latitude = exif?.latitude ?? null
        longitude = exif?.longitude ?? null
      } catch {}
    }

    const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
    if (uploadError) { setError(uploadError.message); setLoading(false); return }

    const mediaId = crypto.randomUUID()
    const { error: insertError } = await supabase.from('media').insert({
      id: mediaId, event_id: eventId, uploaded_by: session.user.id,
      type, storage_path: path, caption: caption.trim() || null,
      taken_at, latitude, longitude,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }

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
    <UploadCard>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <FileLabel>
          <ImagePlus />
          {file ? <FileName>{file.name}</FileName> : 'Choose a photo or video…'}
          <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0] ?? null)} required />
        </FileLabel>
        <FormRow>
          <Input
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ flex: 1 }}
          />
          <PrimaryButton type="submit" disabled={loading || !file}>
            <Upload />
            {loading ? 'Uploading…' : 'Upload'}
          </PrimaryButton>
        </FormRow>
        {error && <ErrorMsg>{error}</ErrorMsg>}
      </form>
    </UploadCard>
  )
}
