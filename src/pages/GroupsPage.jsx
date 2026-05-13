import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Users, UserPlus, Search, X, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import CreateGroup from '../components/CreateGroup'
import GroupDetail from '../components/GroupDetail'
import { PageWrapper, GlassCard, PageTitle, SectionTitle, Input, PrimaryButton, AccentButton, GhostButton, Toolbar, MutedText, ModalOverlay, ModalCard, CloseButton } from '../components/ui'

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
    background: ${({ theme }) => theme.glass.backgroundStrong};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.glass.shadowStrong};
  }
`

const SpecialCard = styled(GroupCard)`
  background: rgba(196, 112, 79, 0.25);
  border-color: rgba(196, 112, 79, 0.5);
`

const CardIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(255, 248, 230, 0.2);
  border: ${({ theme }) => theme.glass.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  svg {
    width: 22px;
    height: 22px;
  }
`

const CardName = styled.h3`
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textLight};
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
  background: rgba(255, 248, 230, 0.12);
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ theme }) => theme.glass.border};
`

const ContactInfo = styled.div`
  flex: 1;
`

const ContactName = styled.p`
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  color: ${({ theme }) => theme.colors.textLight};
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
  const [allContacts, setAllContacts] = useState([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')

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

  async function loadAllContacts() {
    const { data: groupData } = await supabase
      .from('groups')
      .select('id')
      .eq('created_by', session.user.id)
      .is('deleted_at', null)

    if (!groupData?.length) { setAllContacts([]); return }

    const groupIds = groupData.map(g => g.id)
    const { data } = await supabase
      .from('group_members')
      .select('user_id, users(first_name, last_name, email)')
      .in('group_id', groupIds)
      .is('deleted_at', null)

    const seen = new Set()
    const unique = (data ?? []).filter(m => {
      if (seen.has(m.user_id)) return false
      seen.add(m.user_id)
      return true
    })
    setAllContacts(unique)
  }

  useEffect(() => { loadGroups() }, [])

  function handleViewAllContacts() {
    loadAllContacts()
    setShowAllContacts(true)
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  )

  const filteredContacts = allContacts.filter(m =>
    `${m.users.first_name} ${m.users.last_name} ${m.users.email}`
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
            <CardName>View All Contacts</CardName>
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

      {/* Group detail modal */}
      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setSelected(null)}>×</CloseButton>
            <GroupDetail group={selected} onUpdated={loadGroups} />
          </ModalCard>
        </ModalOverlay>
      )}

      {/* Create group modal */}
      {showCreateGroup && (
        <ModalOverlay onClick={() => setShowCreateGroup(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowCreateGroup(false)}>×</CloseButton>
            <SectionTitle style={{ marginBottom: '16px', color: '#FDF8F0' }}>New Group</SectionTitle>
            <CreateGroup onCreated={() => { loadGroups(); setShowCreateGroup(false) }} />
          </ModalCard>
        </ModalOverlay>
      )}

      {/* All contacts modal */}
      {showAllContacts && (
        <ModalOverlay onClick={() => setShowAllContacts(false)}>
          <ModalCard $wide onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowAllContacts(false)}>×</CloseButton>
            <SectionTitle style={{ marginBottom: '16px', color: '#FDF8F0' }}>All Contacts</SectionTitle>
            <Input
              placeholder="Search contacts…"
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            {filteredContacts.length === 0 && <MutedText>No contacts found.</MutedText>}
            <ContactList>
              {filteredContacts.map(m => (
                <ContactRow key={m.user_id}>
                  <ContactInfo>
                    <ContactName>{m.users.first_name} {m.users.last_name}</ContactName>
                    <ContactEmail>{m.users.email}</ContactEmail>
                  </ContactInfo>
                </ContactRow>
              ))}
            </ContactList>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  )
}
