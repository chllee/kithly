import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
        },
      },
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div>
      <h2>Create account</h2>
      <form onSubmit={handleSubmit}>
        <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p>Already have an account? <button type="button" onClick={onSwitch}>Sign in</button></p>
    </div>
  )
}
