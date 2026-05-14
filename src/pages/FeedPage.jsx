import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CalendarDays, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import MediaItem from '../components/MediaItem'
import SearchBar from '../components/SearchBar'
import { PageWrapper, PageTitle, GlassCard, PhotoCard, MutedText } from '../components/ui'

const SearchSection = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const EventSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const EventHeader = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: space-between;
`

const EventLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.sizeLg};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`

const EventMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};

  svg {
    width: 14px;
    height: 14px;
  }
`

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`

export default function FeedPage() {
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: mediaData, error } = await supabase
        .from('media')
        .select(`
          id, event_id, type, storage_path, caption, taken_at, latitude, longitude, uploaded_by, created_at,
          users!media_uploaded_by_fkey(first_name, last_name),
          events!inner(id, name, start_date, end_date, location)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error || !mediaData?.length) { setGroups([]); setLoading(false); return }

      const paths = mediaData.map(m => m.storage_path)
      const { data: urlData } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
      const urlMap = Object.fromEntries(urlData.map(u => [u.path, u.signedUrl]))

      const byEvent = new Map()
      for (const m of mediaData) {
        if (!byEvent.has(m.event_id)) byEvent.set(m.event_id, { event: m.events, items: [] })
        byEvent.get(m.event_id).items.push({ ...m, url: urlMap[m.storage_path] })
      }

      setGroups([...byEvent.values()].sort((a, b) => b.event.start_date.localeCompare(a.event.start_date)))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <Nav />
      <PageWrapper>
        <PageTitle style={{ marginBottom: '24px' }}>Memory Feed</PageTitle>

        <SearchSection>
          <SearchBar />
        </SearchSection>

        {loading && <MutedText>Loading…</MutedText>}
        {!loading && groups.length === 0 && (
          <MutedText>No memories yet. Upload photos to one of your events to see them here.</MutedText>
        )}

        {groups.map(({ event, items }) => (
          <EventSection key={event.id}>
            <EventHeader>
              <EventLink to={`/events/${event.id}`}>{event.name}</EventLink>
              <EventMeta>
                <MetaItem>
                  <CalendarDays />
                  {event.start_date}{event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ''}
                </MetaItem>
                {event.location && (
                  <MetaItem>
                    <MapPin />
                    {event.location}
                  </MetaItem>
                )}
              </EventMeta>
            </EventHeader>

            <PhotoGrid>
              {items.map(item => (
                <PhotoCard key={item.id} onClick={() => setSelected(item)}>
                  {item.type === 'photo'
                    ? <img src={item.url} alt={item.caption ?? ''} />
                    : <video src={item.url} />
                  }
                </PhotoCard>
              ))}
            </PhotoGrid>
          </EventSection>
        ))}

        {selected && <MediaItem item={selected} onClose={() => setSelected(null)} />}
      </PageWrapper>
    </>
  )
}
