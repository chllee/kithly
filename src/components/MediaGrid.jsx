import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import MediaItem from './MediaItem'

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

      if (error || !mediaData?.length) {
        setItems([])
        setLoading(false)
        return
      }

      const paths = mediaData.map(m => m.storage_path)
      const { data: urlData } = await supabase.storage
        .from('media')
        .createSignedUrls(paths, 3600)

      const urlMap = Object.fromEntries(urlData.map(u => [u.path, u.signedUrl]))

      setItems(mediaData.map(m => ({ ...m, url: urlMap[m.storage_path] })))
      setLoading(false)
    }

    load()
  }, [eventId, refresh])

  if (loading) return <p>Loading media…</p>
  if (!items.length) return <p>No media yet.</p>

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {items.map(item => (
          <div key={item.id} onClick={() => setSelected(item)} style={{ cursor: 'pointer' }}>
            {item.type === 'photo'
              ? <img src={item.url} alt={item.caption ?? ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              : <video src={item.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            }
          </div>
        ))}
      </div>

      {selected && (
        <MediaItem item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
