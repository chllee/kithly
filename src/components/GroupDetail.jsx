import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { UserMinus, UserPlus, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const MemberInfo = styled.div`
  flex: 1;
`

const MemberName = styled.p`
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  color: ${({ theme }) => theme.colors.textDark};
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

const SubHeading = styled.h4`
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  color: ${({ theme }) => theme.colors.textMid};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ContactPickRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
`

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.primary};
`

const BulkActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};
`

export default function GroupDetail({ group, onUpdated }) {
  const { session } = useAuth()
  const [members, setMembers] = useState([])
  const [contacts, setContacts] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [bulkError, setBulkError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  async function loadMembers() {
    const { data } = await supabase
      .from('group_members')
      .select('user_id, users(first_name, last_name, email)')
      .eq('group_id', group.id)
      .is('deleted_at', null)
    setMembers(data ?? [])
  }

  async function loadContacts() {
    const { data } = await supabase
      .from('contacts')
      .select('contact_id, users:contact_id(first_name, last_name, email)')
      .eq('owner_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setContacts(data ?? [])
  }

  useEffect(() => {
    loadMembers()
    loadContacts()
    setSelectedIds(new Set())
  }, [group.id])

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

  function toggleSelected(userId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function handleAddSelected() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    setBulkError(null)
    const rows = [...selectedIds].map(userId => ({ group_id: group.id, user_id: userId }))
    const { error: insertError } = await supabase.from('group_members').insert(rows)
    if (insertError) {
      setBulkError(insertError.message)
    } else {
      setSelectedIds(new Set())
      loadMembers()
      onUpdated()
    }
    setBulkLoading(false)
  }

  const memberIds = new Set(members.map(m => m.user_id))
  const availableContacts = contacts.filter(c => !memberIds.has(c.contact_id))

  return (
    <div>
      <SectionTitle style={{ marginBottom: '4px' }}>{group.name}</SectionTitle>
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

      <SubHeading>Add from your contacts</SubHeading>
      {availableContacts.length === 0 ? (
        <MutedText>
          {contacts.length === 0
            ? 'No contacts yet. Add some from the Groups page.'
            : 'All your contacts are already in this group.'}
        </MutedText>
      ) : (
        <>
          <MemberList>
            {availableContacts.map(c => (
              <ContactPickRow key={c.contact_id}>
                <Checkbox
                  checked={selectedIds.has(c.contact_id)}
                  onChange={() => toggleSelected(c.contact_id)}
                />
                <MemberInfo>
                  <MemberName>{c.users.first_name} {c.users.last_name}</MemberName>
                  <MemberEmail>{c.users.email}</MemberEmail>
                </MemberInfo>
              </ContactPickRow>
            ))}
          </MemberList>
          <BulkActions>
            <PrimaryButton
              type="button"
              onClick={handleAddSelected}
              disabled={bulkLoading || selectedIds.size === 0}
            >
              <Users />
              {bulkLoading
                ? 'Adding…'
                : `Add Selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
            </PrimaryButton>
          </BulkActions>
          {bulkError && <ErrorMsg style={{ marginTop: '8px' }}>{bulkError}</ErrorMsg>}
        </>
      )}
    </div>
  )
}
