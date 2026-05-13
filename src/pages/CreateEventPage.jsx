import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import { PageWrapper, GlassCard, PageTitle, Input, PrimaryButton, GhostButton, ErrorMsg } from '../components/ui'

const FormCard = styled(GlassCard)`
  max-width: 520px;
  margin-top: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`

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
    const { error } = await supabase.from('events').insert({
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
    <>
      <Nav />
      <PageWrapper>
        <PageTitle>New Event</PageTitle>
        <FormCard>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Label>
              Event name
              <Input name="name" placeholder="e.g. Grandma's 80th birthday" value={form.name} onChange={handleChange} required />
            </Label>
            <Label>
              Start date
              <Input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
            </Label>
            <Label>
              End date (optional)
              <Input name="end_date" type="date" value={form.end_date} onChange={handleChange} />
            </Label>
            <Label>
              Location (optional)
              <Input name="location" placeholder="e.g. Grandma's house, Singapore" value={form.location} onChange={handleChange} />
            </Label>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <ButtonRow>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create Event'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => navigate('/')}>Cancel</GhostButton>
            </ButtonRow>
          </form>
        </FormCard>
      </PageWrapper>
    </>
  )
}
