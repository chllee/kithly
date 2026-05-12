import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

export default function CreateEventPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', location: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const eventId = crypto.randomUUID()

    const { error } = await supabase
      .from('events')
      .insert({
        id: eventId,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date || null,
        location: form.location || null,
        created_by: session.user.id,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate(`/events/${eventId}`)
  }

  return (
    <div>
      <Nav />
      <h1>New event</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Event name" value={form.name} onChange={handleChange} required />
        <label>
          Start date
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
        </label>
        <label>
          End date (optional)
          <input name="end_date" type="date" value={form.end_date} onChange={handleChange} />
        </label>
        <input name="location" placeholder="Location (optional)" value={form.location} onChange={handleChange} />
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create event'}</button>
        <button type="button" onClick={() => navigate('/')}>Cancel</button>
      </form>
    </div>
  )
}
