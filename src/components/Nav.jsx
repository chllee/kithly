import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Nav() {
  const { session } = useAuth()

  return (
    <nav>
      <Link to="/">Events</Link>
      <Link to="/groups">Groups</Link>
      <span>{session.user.user_metadata.first_name}</span>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </nav>
  )
}
