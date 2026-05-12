import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import InviteMember from '../components/InviteMember'
import MediaUpload from '../components/MediaUpload'
import MediaGrid from '../components/MediaGrid'
import SearchBar from '../components/SearchBar'

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

    if (eventError) { navigate('/'); return }

    setEvent(eventData)
    setMembers(memberData ?? [])
    setIsAdmin(memberData?.some(m => m.user_id === session.user.id && m.role === 'admin') ?? false)
    setLoading(false)
  }

  useEffect(() => { loadEvent() }, [id])

  if (loading) return <><Nav /><p>Loading…</p></>

  return (
    <div>
      <Nav />
      <h1>{event.name}</h1>
      <p>{event.start_date}{event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ''}</p>
      {event.location && <p>{event.location}</p>}

      <h2>Members</h2>
      <ul>
        {members.map(m => (
          <li key={m.user_id}>
            {m.users.first_name} {m.users.last_name} ({m.users.email}) — {m.role}
          </li>
        ))}
      </ul>
      {isAdmin && <InviteMember eventId={id} onInvited={loadEvent} />}

      <h2>Media</h2>
      <MediaUpload eventId={id} onUploaded={() => setMediaRefresh(r => r + 1)} />
      <SearchBar eventId={id} />
      <MediaGrid eventId={id} refresh={mediaRefresh} />
    </div>
  )
}
