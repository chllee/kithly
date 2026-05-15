import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Plus, CalendarDays, MapPin, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import SearchBar from '../components/SearchBar'
import { PageWrapper, PrimaryButton, MutedText } from '../components/ui'

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SearchSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  input {
    background: rgba(255, 255, 255, 0.75);
  }

  @media (min-width: 640px) {
    max-width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
`

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const EventCard = styled(Link)`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.glass.shadow};
  transition: ${({ theme }) => theme.transition};
  cursor: pointer;
  text-decoration: none;
  overflow: hidden;

  &:hover {
    box-shadow: ${({ theme }) => theme.glass.shadowStrong};
    transform: translateY(-2px);
  }

  &:hover img {
    transform: scale(1.04);
  }
`

const CardCover = styled.div`
  width: 100%;
  height: 160px;
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease;
  }
`

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  flex: 1;
`

const EventName = styled.h3`
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
`

const EventMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};

  svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }
`

const DateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.sm};
`

const ChevronIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;

  svg {
    width: 16px;
    height: 16px;
  }
`

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [covers, setCovers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, location')
        .order('start_date', { ascending: false })
      if (error || !data) { setLoading(false); return }

      setEvents(data)

      const eventIds = data.map(e => e.id)
      if (eventIds.length > 0) {
        const { data: mediaData } = await supabase
          .from('media')
          .select('event_id, storage_path')
          .is('deleted_at', null)
          .eq('type', 'photo')
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })

        if (mediaData?.length) {
          const firstPerEvent = {}
          for (const m of mediaData) {
            if (!firstPerEvent[m.event_id]) firstPerEvent[m.event_id] = m
          }
          const paths = Object.values(firstPerEvent).map(m => m.storage_path)
          const { data: urlData } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
          const urlMap = Object.fromEntries((urlData ?? []).map(u => [u.path, u.signedUrl]))
          const coverMap = {}
          for (const [eid, m] of Object.entries(firstPerEvent)) {
            coverMap[eid] = urlMap[m.storage_path]
          }
          setCovers(coverMap)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const [year, month] = dateStr.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <>
      <Nav />
      <PageWrapper>
        <Header>
          <PrimaryButton as={Link} to="/events/new">
            <Plus />
            New Event
          </PrimaryButton>
        </Header>

        <SearchSection>
          <SearchBar />
        </SearchSection>

        {loading && <MutedText>Loading…</MutedText>}
        {!loading && events.length === 0 && (
          <MutedText>No events yet. Create your first event to get started!</MutedText>
        )}

        <EventGrid>
          {events.map(event => (
            <EventCard to={`/events/${event.id}`} key={event.id}>
              <CardCover>
                {covers[event.id] && <img src={covers[event.id]} alt={event.name} />}
              </CardCover>
              <CardBody>
                <EventName>{event.name}</EventName>
                {event.location && (
                  <EventMeta>
                    <MapPin />
                    {event.location}
                  </EventMeta>
                )}
                <DateRow>
                  <EventMeta>
                    <CalendarDays />
                    {formatDate(event.start_date)}
                  </EventMeta>
                  <ChevronIcon><ChevronRight /></ChevronIcon>
                </DateRow>
              </CardBody>
            </EventCard>
          ))}
        </EventGrid>
      </PageWrapper>
    </>
  )
}
