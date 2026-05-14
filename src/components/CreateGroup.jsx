import { useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Input, PrimaryButton, ErrorMsg } from './ui'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

export default function CreateGroup({ onCreated }) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: session.user.id })
      .select('id, name')
      .single()
    if (error) {
      setError(error.message)
    } else {
      setName('')
      onCreated(data)
    }
    setLoading(false)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        placeholder="Group name (e.g. Family, School Friends)"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create Group'}
      </PrimaryButton>
    </Form>
  )
}
