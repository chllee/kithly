import { useState } from 'react'
import styled from 'styled-components'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MediaItem from './MediaItem'
import { Input, PrimaryButton, ErrorMsg, MutedText, PhotoCard } from './ui'

const SearchForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const PhotoCardWithLabel = styled(PhotoCard)`
  position: relative;
`

const EventLabel = styled.p`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 5px 8px;
  background: rgba(28, 25, 23, 0.6);
  color: rgba(255, 255, 255, 0.92);
  font-size: ${({ theme }) => theme.font.sizeXs};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
`

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
    if (!res.ok) { setError(json.error ?? 'Search failed'); setLoading(false); return }

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
      <SearchForm onSubmit={handleSearch}>
        <Input
          placeholder={eventId ? 'Search this event…' : 'Search all your photos…'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          <Search />
          {loading ? 'Searching…' : 'Search'}
        </PrimaryButton>
      </SearchForm>

      {error && <ErrorMsg style={{ marginTop: '8px' }}>{error}</ErrorMsg>}
      {results !== null && results.length === 0 && <MutedText style={{ marginTop: '8px' }}>No results found.</MutedText>}

      {results && results.length > 0 && (
        <ResultsGrid>
          {results.map(r => (
            <PhotoCardWithLabel key={r.media_id} onClick={() => setSelected(r)}>
              {r.type === 'photo'
                ? <img src={r.url} alt={r.caption ?? ''} />
                : <video src={r.url} />
              }
              {!eventId && <EventLabel>{r.event_name}</EventLabel>}
            </PhotoCardWithLabel>
          ))}
        </ResultsGrid>
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
