import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function InviteMember({ eventId, onInvited }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (userError || !user) {
      setError('No account found with that email.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('event_members')
      .insert({ event_id: eventId, user_id: user.id, role: 'member' })

    if (insertError) {
      setError(insertError.message)
    } else {
      setEmail('')
      onInvited()
    }

    setLoading(false)
  }

  return (
    <div>
      <h3>Invite member</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Inviting…' : 'Invite'}</button>
      </form>
    </div>
  )
}
