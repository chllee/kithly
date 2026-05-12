import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function MediaItem({ item, onClose }) {
  const { session } = useAuth()
  const [comments, setComments] = useState([])
  const [tags, setTags] = useState([])
  const [isFavourited, setIsFavourited] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    loadAll()
  }, [item.id])

  async function loadAll() {
    const [{ data: commentData }, { data: tagData }, { data: favData }] = await Promise.all([
      supabase
        .from('media_comments')
        .select('id, content, created_at, updated_at, user_id, users(first_name, last_name)')
        .eq('media_id', item.id)
        .is('deleted_at', null)
        .order('created_at'),
      supabase
        .from('media_tags')
        .select('id, tag, user_id, users(first_name, last_name)')
        .eq('media_id', item.id),
      supabase
        .from('media_favourites')
        .select('user_id')
        .eq('media_id', item.id)
        .eq('user_id', session.user.id)
        .maybeSingle(),
    ])

    setComments(commentData ?? [])
    setTags(tagData ?? [])
    setIsFavourited(!!favData)
  }

  async function toggleFavourite() {
    if (isFavourited) {
      await supabase.from('media_favourites')
        .delete()
        .eq('media_id', item.id)
        .eq('user_id', session.user.id)
    } else {
      await supabase.from('media_favourites')
        .insert({ media_id: item.id, user_id: session.user.id })
    }
    setIsFavourited(f => !f)
  }

  async function addComment(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    await supabase.from('media_comments').insert({
      media_id: item.id,
      user_id: session.user.id,
      content: newComment.trim(),
    })
    setNewComment('')
    loadAll()
  }

  async function saveEdit(id) {
    await supabase.from('media_comments')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id)
    setEditingId(null)
    loadAll()
  }

  async function deleteComment(id) {
    await supabase.from('media_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    loadAll()
  }

  async function addTag(e) {
    e.preventDefault()
    if (!newTag.trim()) return
    await supabase.from('media_tags').insert({
      media_id: item.id,
      user_id: session.user.id,
      tag: newTag.trim().toLowerCase(),
    })
    setNewTag('')
    loadAll()
  }

  async function removeTag(id) {
    await supabase.from('media_tags').delete().eq('id', id)
    loadAll()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>✕</button>

        {item.type === 'photo'
          ? <img src={item.url} alt={item.caption ?? ''} style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
          : <video src={item.url} controls style={{ width: '100%', maxHeight: '50vh' }} />
        }

        <div>
          {item.caption && <p>{item.caption}</p>}
          <p>Uploaded by {item.users.first_name} {item.users.last_name}</p>
          {item.taken_at && <p>Taken {new Date(item.taken_at).toLocaleDateString()}</p>}
          {item.latitude && <p>Location: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p>}
          <button onClick={toggleFavourite}>{isFavourited ? '★ Favourited' : '☆ Favourite'}</button>
        </div>

        <div>
          <h3>Tags</h3>
          <div>
            {tags.map(t => (
              <span key={t.id}>
                #{t.tag} ({t.users.first_name})
                {t.user_id === session.user.id && (
                  <button onClick={() => removeTag(t.id)}>×</button>
                )}
              </span>
            ))}
          </div>
          <form onSubmit={addTag}>
            <input
              placeholder="Add a tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </div>

        <div>
          <h3>Comments</h3>
          {comments.map(c => (
            <div key={c.id}>
              <strong>{c.users.first_name}:</strong>
              {editingId === c.id ? (
                <>
                  <input value={editContent} onChange={e => setEditContent(e.target.value)} />
                  <button onClick={() => saveEdit(c.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span> {c.content}</span>
                  {c.updated_at && <span> (edited)</span>}
                  {c.user_id === session.user.id && (
                    <>
                      <button onClick={() => { setEditingId(c.id); setEditContent(c.content) }}>Edit</button>
                      <button onClick={() => deleteComment(c.id)}>Delete</button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
          <form onSubmit={addComment}>
            <input
              placeholder="Add a comment"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        </div>
      </div>
    </div>
  )
}
