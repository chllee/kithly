import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import SearchBar from '../components/SearchBar'

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

  return (
    <div>
      <Nav />
      <h1>Events</h1>
      <SearchBar />
      <Link to="/events/new">+ New event</Link>
      {loading && <p>Loading…</p>}
      {!loading && events.length === 0 && <p>No events yet.</p>}
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <Link to={`/events/${event.id}`}>
              <strong>{event.name}</strong>
              <span> — {event.start_date}{event.end_date && event.end_date !== event.start_date ? ` to ${event.end_date}` : ''}</span>
              {event.location && <span> · {event.location}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
