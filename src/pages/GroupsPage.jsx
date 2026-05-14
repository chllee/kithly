import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Users, UserPlus, UserMinus, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import CreateGroup from '../components/CreateGroup'
import GroupDetail from '../components/GroupDetail'
import { PageWrapper, GlassCard, PageTitle, SectionTitle, Input, PrimaryButton, AccentButton, GhostButton, MutedText, ErrorMsg, ModalOverlay, ModalCard, CloseButton } from '../components/ui'

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const SearchRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`

const GroupCard = styled(GlassCard)`
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    box-shadow: ${({ theme }) => theme.glass.shadowStrong};
    transform: translateY(-1px);
  }
`

const SpecialCard = styled(GroupCard)`
  background: rgba(255, 151, 26, 0.06);
  border-color: rgba(255, 151, 26, 0.25);
`

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMid};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  svg {
    width: 20px;
    height: 20px;
  }
`

const CardName = styled.h3`
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
`

const CardArrow = styled.div`
  margin-top: auto;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;

  svg {
    width: 16px;
    height: 16px;
  }
`

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const ContactRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const ContactInfo = styled.div`
  flex: 1;
`

const ContactName = styled.p`
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: ${({ theme }) => theme.font.sizeBase};
`

const ContactEmail = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

export default function GroupsPage() {
  const { session } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAllContacts, setShowAllContacts] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [allContacts, setAllContacts] = useState([])
  const [contactCount, setContactCount] = useState(0)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [standaloneEmail, setStandaloneEmail] = useState('')
  const [standaloneLoading, setStandaloneLoading] = useState(false)
  const [standaloneError, setStandaloneError] = useState(null)

  async function loadGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name')
      .eq('created_by', session.user.id)
      .is('deleted_at', null)
      .order('name')
    if (!error) setGroups(data)
    setLoading(false)
  }

  async function loadContactCount() {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', session.user.id)
      .is('deleted_at', null)
    setContactCount(count ?? 0)
  }

  async function loadAllContacts() {
    const { data } = await supabase
      .from('contacts')
      .select('contact_id, users:contact_id(first_name, last_name, email)')
      .eq('owner_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setAllContacts(data ?? [])
    setContactCount(data?.length ?? 0)
  }

  async function addContactByEmail(rawEmail) {
    const email = rawEmail.trim().toLowerCase()
    if (!email) return { error: 'Enter an email.' }
    if (email === session.user.email?.toLowerCase()) {
      return { error: "You can't add yourself." }
    }
    const { data: user, error: userError } = await supabase
      .from('users').select('id').eq('email', email).single()
    if (userError || !user) return { error: 'No account found with that email.' }

    const { error: insertError } = await supabase
      .from('contacts')
      .insert({ owner_id: session.user.id, contact_id: user.id })
    if (!insertError) return { ok: true }

    if (insertError.code === '23505') {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id, deleted_at')
        .eq('owner_id', session.user.id)
        .eq('contact_id', user.id)
        .single()
      if (existing?.deleted_at) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ deleted_at: null })
          .eq('id', existing.id)
        if (updateError) return { error: updateError.message }
        return { ok: true }
      }
      return { error: 'Already in your contacts.' }
    }
    return { error: insertError.message }
  }

  async function handleAddContact(e) {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    const result = await addContactByEmail(addEmail)
    if (result.error) {
      setAddError(result.error)
    } else {
      setAddEmail('')
      loadAllContacts()
    }
    setAddLoading(false)
  }

  async function handleStandaloneAdd(e) {
    e.preventDefault()
    setStandaloneLoading(true)
    setStandaloneError(null)
    const result = await addContactByEmail(standaloneEmail)
    if (result.error) {
      setStandaloneError(result.error)
    } else {
      setStandaloneEmail('')
      loadContactCount()
      setShowAddContact(false)
    }
    setStandaloneLoading(false)
  }

  async function handleRemoveContact(contactUserId) {
    await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('owner_id', session.user.id)
      .eq('contact_id', contactUserId)
      .is('deleted_at', null)
    loadAllContacts()
  }

  useEffect(() => {
    loadGroups()
    loadContactCount()
  }, [])

  function handleViewAllContacts() {
    loadAllContacts()
    setAddEmail('')
    setAddError(null)
    setContactSearch('')
    setShowAllContacts(true)
  }

  function handleOpenAddContact() {
    setStandaloneEmail('')
    setStandaloneError(null)
    setShowAddContact(true)
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const filteredContacts = allContacts.filter(c =>
    `${c.users.first_name} ${c.users.last_name} ${c.users.email}`
      .toLowerCase()
      .includes(contactSearch.toLowerCase())
  )

  return (
    <>
      <Nav />
      <PageWrapper>
        <Header>
          <PageTitle>Groups</PageTitle>
          <HeaderActions>
            <AccentButton onClick={handleOpenAddContact}>
              <UserPlus />
              Add Contact
            </AccentButton>
            <AccentButton onClick={() => setShowCreateGroup(true)}>
              <UserPlus />
              Add New Group
            </AccentButton>
          </HeaderActions>
        </Header>

        <SearchRow>
          <Input
            placeholder="Search groups…"
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
          />
        </SearchRow>

        {loading && <MutedText>Loading…</MutedText>}

        <GroupGrid>
          <SpecialCard onClick={handleViewAllContacts}>
            <CardIcon><Users /></CardIcon>
            <CardName>All My Contacts</CardName>
            <MutedText style={{ fontSize: '14px' }}>
              {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
            </MutedText>
            <CardArrow><ChevronRight /></CardArrow>
          </SpecialCard>

          {filteredGroups.map(g => (
            <GroupCard key={g.id} onClick={() => setSelected(g)}>
              <CardIcon><Users /></CardIcon>
              <CardName>{g.name}</CardName>
              <CardArrow><ChevronRight /></CardArrow>
            </GroupCard>
          ))}

          {!loading && groups.length === 0 && (
            <MutedText style={{ gridColumn: '1/-1' }}>No groups yet. Create one to get started.</MutedText>
          )}
        </GroupGrid>
      </PageWrapper>

      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelected(null)}>×</CloseButton>
            <GroupDetail group={selected} onUpdated={loadGroups} />
          </ModalCard>
        </ModalOverlay>
      )}

      {showCreateGroup && (
        <ModalOverlay onClick={() => setShowCreateGroup(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowCreateGroup(false)}>×</CloseButton>
            <SectionTitle style={{ marginBottom: '16px' }}>New Group</SectionTitle>
            <CreateGroup onCreated={(newGroup) => {
              loadGroups()
              setShowCreateGroup(false)
              if (newGroup) setSelected(newGroup)
            }} />
          </ModalCard>
        </ModalOverlay>
      )}

      {showAddContact && (
        <ModalOverlay onClick={() => setShowAddContact(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowAddContact(false)}>×</CloseButton>
            <SectionTitle style={{ marginBottom: '16px' }}>Add Contact</SectionTitle>
            <form
              onSubmit={handleStandaloneAdd}
              style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
            >
              <Input
                type="email"
                placeholder="Contact email"
                value={standaloneEmail}
                onChange={e => setStandaloneEmail(e.target.value)}
                required
                style={{ flex: 1, minWidth: '200px' }}
              />
              <PrimaryButton type="submit" disabled={standaloneLoading}>
                <UserPlus />
                {standaloneLoading ? 'Adding…' : 'Add'}
              </PrimaryButton>
            </form>
            {standaloneError && <ErrorMsg style={{ marginTop: '12px' }}>{standaloneError}</ErrorMsg>}
          </ModalCard>
        </ModalOverlay>
      )}

      {showAllContacts && (
        <ModalOverlay onClick={() => setShowAllContacts(false)}>
          <ModalCard $wide onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowAllContacts(false)}>×</CloseButton>
            <SectionTitle style={{ marginBottom: '16px' }}>All My Contacts</SectionTitle>

            <form
              onSubmit={handleAddContact}
              style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}
            >
              <Input
                type="email"
                placeholder="Add contact by email"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                required
                style={{ flex: 1, minWidth: '200px' }}
              />
              <PrimaryButton type="submit" disabled={addLoading}>
                <UserPlus />
                {addLoading ? 'Adding…' : 'Add'}
              </PrimaryButton>
            </form>
            {addError && <ErrorMsg style={{ marginBottom: '12px' }}>{addError}</ErrorMsg>}

            <Input
              placeholder="Search contacts…"
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            {filteredContacts.length === 0 && <MutedText>No contacts found.</MutedText>}
            <ContactList>
              {filteredContacts.map(c => (
                <ContactRow key={c.contact_id}>
                  <ContactInfo>
                    <ContactName>{c.users.first_name} {c.users.last_name}</ContactName>
                    <ContactEmail>{c.users.email}</ContactEmail>
                  </ContactInfo>
                  <GhostButton onClick={() => handleRemoveContact(c.contact_id)}>
                    <UserMinus />
                    Remove
                  </GhostButton>
                </ContactRow>
              ))}
            </ContactList>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  )
}
