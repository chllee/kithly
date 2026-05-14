import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { CalendarDays, MapPin, Crown, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import InviteMember from '../components/InviteMember'
import MediaUpload from '../components/MediaUpload'
import MediaGrid from '../components/MediaGrid'
import SearchBar from '../components/SearchBar'
import { PageWrapper, GlassCard, PageTitle, SectionTitle, MutedText } from '../components/ui'

const EventHeader = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
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
  }
`

const Section = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const MemberList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MemberChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.textMid};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};

  svg {
    width: 13px;
    height: 13px;
    color: ${({ $admin }) => $admin ? '#ff971a' : '#A8A29E'};
  }
`

export default function EventPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mediaRefresh, setMediaRefresh] = useState(0)

  async function loadEvent() {
    const [{ data: eventData, error: eventError }, { data: memberData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_members').select('role, user_id, users(first_name, last_name, email)').eq('event_id', id),
    ])
    if (eventError) { navigate('/events'); return }
    setEvent(eventData)
    setMembers(memberData ?? [])
    setIsAdmin(memberData?.some(m => m.user_id === session.user.id && m.role === 'admin') ?? false)
    setLoading(false)
  }

  useEffect(() => { loadEvent() }, [id])

  if (loading) return <><Nav /><PageWrapper><MutedText>Loading…</MutedText></PageWrapper></>

  return (
    <>
      <Nav />
      <PageWrapper>
        <EventHeader>
          <PageTitle>{event.name}</PageTitle>
          <EventMeta>
            <CalendarDays />
            {event.start_date}{event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ''}
          </EventMeta>
          {event.location && (
            <EventMeta>
              <MapPin />
              {event.location}
            </EventMeta>
          )}
        </EventHeader>

        <Section>
          <SectionHeader>
            <SectionTitle>Members</SectionTitle>
          </SectionHeader>
          <MemberList>
            {members.map(m => (
              <MemberChip key={m.user_id} $admin={m.role === 'admin'}>
                {m.role === 'admin' ? <Crown /> : <User />}
                {m.users.first_name} {m.users.last_name}
              </MemberChip>
            ))}
          </MemberList>
          {isAdmin && <InviteMember eventId={id} onInvited={loadEvent} />}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Photos &amp; Videos</SectionTitle>
          </SectionHeader>
          <MediaUpload eventId={id} onUploaded={() => setMediaRefresh(r => r + 1)} />
          <SearchBar eventId={id} />
          <MediaGrid eventId={id} refresh={mediaRefresh} />
        </Section>
      </PageWrapper>
    </>
  )
}
