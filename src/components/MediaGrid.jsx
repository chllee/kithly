import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'
import MediaItem from './MediaItem'
import { MutedText } from './ui'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const Thumbnail = styled.div`
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;

  &:hover img,
  &:hover video {
    transform: scale(1.05);
  }

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }
`

export default function MediaGrid({ eventId, refresh }) {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: mediaData, error } = await supabase
        .from('media')
        .select('id, type, storage_path, caption, taken_at, latitude, longitude, uploaded_by, users!media_uploaded_by_fkey(first_name, last_name)')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error || !mediaData?.length) { setItems([]); setLoading(false); return }

      const paths = mediaData.map(m => m.storage_path)
      const { data: urlData } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
      const urlMap = Object.fromEntries(urlData.map(u => [u.path, u.signedUrl]))
      setItems(mediaData.map(m => ({ ...m, url: urlMap[m.storage_path] })))
      setLoading(false)
    }
    load()
  }, [eventId, refresh])

  if (loading) return <MutedText>Loading media…</MutedText>
  if (!items.length) return <MutedText>No photos or videos yet.</MutedText>

  return (
    <>
      <Grid>
        {items.map(item => (
          <Thumbnail key={item.id} onClick={() => setSelected(item)}>
            {item.type === 'photo'
              ? <img src={item.url} alt={item.caption ?? ''} />
              : <video src={item.url} />
            }
          </Thumbnail>
        ))}
      </Grid>
      {selected && <MediaItem item={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
