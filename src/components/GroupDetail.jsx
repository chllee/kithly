import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GroupDetail({ group, onUpdated }) {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadMembers() {
    const { data } = await supabase
      .from('group_members')
      .select('user_id, users(first_name, last_name, email)')
      .eq('group_id', group.id)
      .is('deleted_at', null)

    setMembers(data ?? [])
  }

  useEffect(() => { loadMembers() }, [group.id])

  async function handleAddMember(e) {
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
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (insertError) {
      setError(insertError.message)
    } else {
      setEmail('')
      loadMembers()
      onUpdated()
    }

    setLoading(false)
  }

  async function handleRemove(userId) {
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', userId)

    loadMembers()
    onUpdated()
  }

  return (
    <div>
      <h2>{group.name}</h2>
      <ul>
        {members.map(m => (
          <li key={m.user_id}>
            {m.users.first_name} {m.users.last_name} ({m.users.email})
            <button onClick={() => handleRemove(m.user_id)}>Remove</button>
          </li>
        ))}
        {members.length === 0 && <li>No members yet.</li>}
      </ul>
      <form onSubmit={handleAddMember}>
        <input
          type="email"
          placeholder="Add by email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add member'}</button>
      </form>
    </div>
  )
}
