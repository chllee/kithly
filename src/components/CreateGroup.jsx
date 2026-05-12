import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CreateGroup({ onCreated }) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: session.user.id })

    if (error) {
      setError(error.message)
    } else {
      setName('')
      onCreated()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="New group name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create group'}</button>
    </form>
  )
}
