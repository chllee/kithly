import { useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'

const Screen = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.glass.backgroundStrong};
  backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  border: ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.glass.borderRadius};
  box-shadow: ${({ theme }) => theme.glass.shadowStrong};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Wordmark = styled.h1`
  text-align: center;
  font-size: ${({ theme }) => theme.font.sizeXl};
  font-weight: ${({ theme }) => theme.font.weightExtrabold};
  color: ${({ theme }) => theme.colors.textLight};
  letter-spacing: -1px;
  text-shadow: 0 2px 12px rgba(90, 20, 10, 0.4);
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
  padding: 14px ${({ theme }) => theme.spacing.md};
  background: rgba(255, 248, 230, 0.25);
  border: 1px solid rgba(255, 248, 230, 0.45);
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeMd};
  transition: ${({ theme }) => theme.transition};
  outline: none;

  &::placeholder {
    color: rgba(253, 248, 240, 0.55);
  }

  &:focus {
    background: rgba(255, 248, 230, 0.35);
    border-color: rgba(255, 248, 230, 0.7);
  }
`

const PrimaryButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeMd};
  font-weight: ${({ theme }) => theme.font.weightBold};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: 0 4px 16px rgba(90, 20, 10, 0.35);
  transition: ${({ theme }) => theme.transition};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(90, 20, 10, 0.45);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorBg};
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
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: ${({ theme }) => theme.font.weightBold};
  font-size: ${({ theme }) => theme.font.sizeSm};
  text-decoration: underline;
  background: none;
  border: none;
  margin-left: 4px;
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
