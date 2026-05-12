import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MediaItem from './MediaItem'

export default function SearchBar({ eventId }) {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('http://localhost:3001/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, userId: session.user.id, eventId: eventId ?? null }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Search failed')
      setLoading(false)
      return
    }

    // Get signed URLs for all result images
    const paths = json.results.map(r => r.storage_path)
    const { data: urlData } = paths.length
      ? await supabase.storage.from('media').createSignedUrls(paths, 3600)
      : { data: [] }

    const urlMap = Object.fromEntries((urlData ?? []).map(u => [u.path, u.signedUrl]))

    setResults(json.results.map(r => ({ ...r, url: urlMap[r.storage_path] })))
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          placeholder={eventId ? 'Search this event…' : 'Search all your photos…'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <p>{error}</p>}

      {results !== null && results.length === 0 && <p>No results found.</p>}

      {results && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
          {results.map(r => (
            <div key={r.media_id} onClick={() => setSelected(r)} style={{ cursor: 'pointer' }}>
              {r.type === 'photo'
                ? <img src={r.url} alt={r.caption ?? ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                : <video src={r.url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              }
              {!eventId && <p style={{ margin: '2px 0', fontSize: '0.8em' }}>{r.event_name}</p>}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <MediaItem
          item={{ ...selected, id: selected.media_id }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
