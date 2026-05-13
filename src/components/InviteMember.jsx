import { useState } from 'react'
import styled from 'styled-components'
import { UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input, PrimaryButton, ErrorMsg } from './ui'

const Form = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

export default function InviteMember({ eventId, onInvited }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: user, error: userError } = await supabase
      .from('users').select('id').eq('email', email.trim()).single()
    if (userError || !user) { setError('No account found with that email.'); setLoading(false); return }
    const { error: insertError } = await supabase
      .from('event_members').insert({ event_id: eventId, user_id: user.id, role: 'member' })
    if (insertError) {
      setError(insertError.message)
    } else {
      setEmail('')
      onInvited()
    }
    setLoading(false)
  }

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Invite by email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ flex: 1, minWidth: '200px' }}
        />
        <PrimaryButton type="submit" disabled={loading}>
          <UserPlus />
          {loading ? 'Inviting…' : 'Invite'}
        </PrimaryButton>
      </Form>
      {error && <ErrorMsg style={{ marginTop: '8px' }}>{error}</ErrorMsg>}
    </>
  )
}
