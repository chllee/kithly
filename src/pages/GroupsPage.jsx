import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import CreateGroup from '../components/CreateGroup'
import GroupDetail from '../components/GroupDetail'

export default function GroupsPage() {
  const { session } = useAuth()
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => { loadGroups() }, [])

  return (
    <div>
      <Nav />
      <h1>Groups</h1>
      <CreateGroup onCreated={loadGroups} />
      {loading && <p>Loading…</p>}
      {!loading && groups.length === 0 && <p>No groups yet.</p>}
      <ul>
        {groups.map(g => (
          <li key={g.id}>
            <button onClick={() => setSelected(selected?.id === g.id ? null : g)}>{g.name}</button>
          </li>
        ))}
      </ul>
      {selected && <GroupDetail group={selected} onUpdated={loadGroups} />}
    </div>
  )
}
