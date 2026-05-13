import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { UserMinus, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SectionTitle, Input, PrimaryButton, GhostButton, ErrorMsg, MutedText } from './ui'

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.md} 0;
`

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: rgba(255, 248, 230, 0.12);
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ theme }) => theme.glass.border};
`

const MemberInfo = styled.div`
  flex: 1;
`

const MemberName = styled.p`
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeBase};
`

const MemberEmail = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const AddForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

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
      .from('users').select('id').eq('email', email.trim()).single()
    if (userError || !user) {
      setError('No account found with that email.')
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase
      .from('group_members').insert({ group_id: group.id, user_id: user.id })
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
    await supabase.from('group_members')
      .delete().eq('group_id', group.id).eq('user_id', userId)
    loadMembers()
    onUpdated()
  }

  return (
    <div>
      <SectionTitle style={{ color: '#FDF8F0', marginBottom: '4px' }}>{group.name}</SectionTitle>
      <MemberList>
        {members.length === 0 && <MutedText>No members yet.</MutedText>}
        {members.map(m => (
          <MemberRow key={m.user_id}>
            <MemberInfo>
              <MemberName>{m.users.first_name} {m.users.last_name}</MemberName>
              <MemberEmail>{m.users.email}</MemberEmail>
            </MemberInfo>
            <GhostButton onClick={() => handleRemove(m.user_id)}>
              <UserMinus />
              Remove
            </GhostButton>
          </MemberRow>
        ))}
      </MemberList>
      <AddForm onSubmit={handleAddMember}>
        <Input
          type="email"
          placeholder="Add member by email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ flex: 1, minWidth: '200px' }}
        />
        <PrimaryButton type="submit" disabled={loading}>
          <UserPlus />
          {loading ? 'Adding…' : 'Add'}
        </PrimaryButton>
      </AddForm>
      {error && <ErrorMsg style={{ marginTop: '8px' }}>{error}</ErrorMsg>}
    </div>
  )
}
