import { useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'

const Screen = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bg};
`

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Wordmark = styled.h1`
  text-align: center;
  font-size: ${({ theme }) => theme.font.sizeXl};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
  letter-spacing: -0.5px;
`

const Subtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeBase};
  margin-top: -${({ theme }) => theme.spacing.md};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`

const Input = styled.input`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-family: inherit;
  transition: ${({ theme }) => theme.transition};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(255, 151, 26, 0.12);
  }
`

const PrimaryButton = styled.button`
  width: 100%;
  padding: 13px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-family: inherit;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  transition: ${({ theme }) => theme.transition};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.errorText};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
`

const SwitchRow = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const SwitchButton = styled.button`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-size: ${({ theme }) => theme.font.sizeSm};
  background: none;
  border: none;
  margin-left: 4px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`

export default function SignUp({ onSwitch }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.firstName, last_name: form.lastName } },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <Screen>
      <Card>
        <Wordmark>Kithly</Wordmark>
        <Subtitle>Create your account</Subtitle>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
            <Input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
          </Row>
          <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <Input name="password" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={handleChange} required minLength={6} />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <PrimaryButton type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</PrimaryButton>
        </Form>
        <SwitchRow>
          Already have an account?
          <SwitchButton type="button" onClick={onSwitch}>Sign in</SwitchButton>
        </SwitchRow>
      </Card>
    </Screen>
  )
}
