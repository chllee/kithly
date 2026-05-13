import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Plus, CalendarDays, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import SearchBar from '../components/SearchBar'
import { PageWrapper, PageTitle, GlassCard, PrimaryButton, Toolbar, MutedText } from '../components/ui'

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const EventCard = styled(GlassCard)`
  padding: ${({ theme }) => theme.spacing.lg};
  transition: ${({ theme }) => theme.transition};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background: ${({ theme }) => theme.glass.backgroundStrong};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.glass.shadowStrong};
  }
`

const EventName = styled.h3`
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textLight};
`

const EventMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`

const SearchSection = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, location')
        .order('start_date', { ascending: false })
      if (!error) setEvents(data)
      setLoading(false)
    }
    load()
  }, [])

  function formatDates(start, end) {
    if (!end || end === start) return start
    return `${start} – ${end}`
  }

  return (
    <>
      <Nav />
      <PageWrapper>
        <Header>
          <PageTitle>Events</PageTitle>
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
            <EventCard as={Link} to={`/events/${event.id}`} key={event.id}>
              <EventName>{event.name}</EventName>
              <EventMeta>
                <CalendarDays />
                {formatDates(event.start_date, event.end_date)}
              </EventMeta>
              {event.location && (
                <EventMeta>
                  <MapPin />
                  {event.location}
                </EventMeta>
              )}
            </EventCard>
          ))}
        </EventGrid>
      </PageWrapper>
    </>
  )
}
