import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Star, Tag, MessageCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ModalOverlay, ModalCard, Input, PrimaryButton, GhostButton, ErrorMsg, MutedText } from './ui'

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 248, 230, 0.2);
  border: 1px solid rgba(255, 248, 230, 0.35);
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${({ theme }) => theme.transition};
  z-index: 1;

  &:hover { background: rgba(255, 248, 230, 0.35); }

  svg { width: 16px; height: 16px; }
`

const Media = styled.div`
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: rgba(0,0,0,0.3);
  margin-bottom: ${({ theme }) => theme.spacing.md};

  img, video {
    width: 100%;
    max-height: 52vh;
    object-fit: contain;
    display: block;
  }
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MetaText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const Caption = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeBase};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const FavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $active, theme }) => $active ? 'rgba(245, 166, 35, 0.3)' : theme.glass.background};
  border: 1px solid ${({ $active }) => $active ? 'rgba(245, 166, 35, 0.6)' : 'rgba(255, 248, 230, 0.35)'};
  color: ${({ $active, theme }) => $active ? '#F5A623' : theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  transition: ${({ theme }) => theme.transition};

  &:hover { background: rgba(245, 166, 35, 0.2); }

  svg { width: 16px; height: 16px; }
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 248, 230, 0.2);
  margin: ${({ theme }) => theme.spacing.md} 0;
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: ${({ theme }) => theme.font.weightBold};
  font-size: ${({ theme }) => theme.font.sizeSm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  svg { width: 14px; height: 14px; }
`

const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 248, 230, 0.18);
  border: 1px solid rgba(255, 248, 230, 0.3);
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const AiTagChip = styled(TagChip)`
  background: rgba(196, 112, 79, 0.2);
  border-color: rgba(196, 112, 79, 0.4);
  color: #FFD8C0;
`

const RemoveTag = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  line-height: 1;
  padding: 0 0 0 2px;

  &:hover { color: ${({ theme }) => theme.colors.textLight}; }
`

const AddTagForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const CommentRow = styled.div`
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: rgba(255, 248, 230, 0.1);
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid rgba(255, 248, 230, 0.2);
`

const CommentAuthor = styled.span`
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
  margin-right: 6px;
`

const CommentText = styled.span`
  color: rgba(253, 248, 240, 0.85);
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const CommentActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 6px;

  button {
    font-size: ${({ theme }) => theme.font.sizeXs};
    color: ${({ theme }) => theme.colors.textMuted};
    background: none;
    border: none;
    padding: 2px 0;

    &:hover { color: ${({ theme }) => theme.colors.textLight}; }
  }
`

const AddCommentForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

export default function MediaItem({ item, onClose }) {
  const { session } = useAuth()
  const [comments, setComments] = useState([])
  const [tags, setTags] = useState([])
  const [aiTags, setAiTags] = useState([])
  const [isFavourited, setIsFavourited] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => { loadAll() }, [item.id])

  async function loadAll() {
    const [{ data: commentData }, { data: tagData }, { data: aiTagData }, { data: favData }] = await Promise.all([
      supabase.from('media_comments')
        .select('id, content, created_at, updated_at, user_id, users(first_name, last_name)')
        .eq('media_id', item.id).is('deleted_at', null).order('created_at'),
      supabase.from('media_tags')
        .select('id, tag, user_id, users(first_name, last_name)').eq('media_id', item.id),
      supabase.from('media_ai_tags')
        .select('id, tag').eq('media_id', item.id).order('tag'),
      supabase.from('media_favourites')
        .select('user_id').eq('media_id', item.id).eq('user_id', session.user.id).maybeSingle(),
    ])
    setComments(commentData ?? [])
    setTags(tagData ?? [])
    setAiTags(aiTagData ?? [])
    setIsFavourited(!!favData)
  }

  async function toggleFavourite() {
    if (isFavourited) {
      await supabase.from('media_favourites').delete().eq('media_id', item.id).eq('user_id', session.user.id)
    } else {
      await supabase.from('media_favourites').insert({ media_id: item.id, user_id: session.user.id })
    }
    setIsFavourited(f => !f)
  }

  async function addComment(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    await supabase.from('media_comments').insert({ media_id: item.id, user_id: session.user.id, content: newComment.trim() })
    setNewComment('')
    loadAll()
  }

  async function saveEdit(id) {
    await supabase.from('media_comments').update({ content: editContent, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingId(null)
    loadAll()
  }

  async function deleteComment(id) {
    await supabase.from('media_comments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    loadAll()
  }

  async function addTag(e) {
    e.preventDefault()
    if (!newTag.trim()) return
    await supabase.from('media_tags').insert({ media_id: item.id, user_id: session.user.id, tag: newTag.trim().toLowerCase() })
    setNewTag('')
    loadAll()
  }

  async function removeTag(id) {
    await supabase.from('media_tags').delete().eq('id', id)
    loadAll()
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard $wide onClick={e => e.stopPropagation()}>
        <CloseBtn onClick={onClose}><X /></CloseBtn>

        <Media>
          {item.type === 'photo'
            ? <img src={item.url} alt={item.caption ?? ''} />
            : <video src={item.url} controls />
          }
        </Media>

        <MetaRow>
          <div>
            {item.caption && <Caption>{item.caption}</Caption>}
            <MetaText>
              Uploaded by {item.users.first_name} {item.users.last_name}
              {item.taken_at && ` · Taken ${new Date(item.taken_at).toLocaleDateString()}`}
            </MetaText>
            {item.latitude && (
              <MetaText>📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</MetaText>
            )}
          </div>
          <FavButton onClick={toggleFavourite} $active={isFavourited}>
            <Star />
            {isFavourited ? 'Favourited' : 'Favourite'}
          </FavButton>
        </MetaRow>

        <Divider />

        <SectionLabel><Tag />Your Tags</SectionLabel>
        <TagsRow>
          {tags.map(t => (
            <TagChip key={t.id}>
              #{t.tag}
              {t.user_id === session.user.id && (
                <RemoveTag onClick={() => removeTag(t.id)}>×</RemoveTag>
              )}
            </TagChip>
          ))}
          {tags.length === 0 && <MutedText>No tags yet.</MutedText>}
        </TagsRow>
        <AddTagForm onSubmit={addTag}>
          <Input placeholder="Add a tag…" value={newTag} onChange={e => setNewTag(e.target.value)} />
          <PrimaryButton type="submit">Add</PrimaryButton>
        </AddTagForm>

        {aiTags.length > 0 && (
          <>
            <Divider />
            <SectionLabel><Tag />AI Tags</SectionLabel>
            <TagsRow>
              {aiTags.map(t => (
                <AiTagChip key={t.id}>#{t.tag}</AiTagChip>
              ))}
            </TagsRow>
          </>
        )}

        <Divider />

        <SectionLabel><MessageCircle />Comments</SectionLabel>
        <CommentList>
          {comments.length === 0 && <MutedText>No comments yet.</MutedText>}
          {comments.map(c => (
            <CommentRow key={c.id}>
              <CommentAuthor>{c.users.first_name}:</CommentAuthor>
              {editingId === c.id ? (
                <>
                  <Input value={editContent} onChange={e => setEditContent(e.target.value)} style={{ margin: '6px 0' }} />
                  <CommentActions>
                    <button onClick={() => saveEdit(c.id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </CommentActions>
                </>
              ) : (
                <>
                  <CommentText>{c.content}</CommentText>
                  {c.updated_at && <CommentText> (edited)</CommentText>}
                  {c.user_id === session.user.id && (
                    <CommentActions>
                      <button onClick={() => { setEditingId(c.id); setEditContent(c.content) }}>Edit</button>
                      <button onClick={() => deleteComment(c.id)}>Delete</button>
                    </CommentActions>
                  )}
                </>
              )}
            </CommentRow>
          ))}
        </CommentList>
        <AddCommentForm onSubmit={addComment}>
          <Input placeholder="Add a comment…" value={newComment} onChange={e => setNewComment(e.target.value)} />
          <PrimaryButton type="submit">Post</PrimaryButton>
        </AddCommentForm>
      </ModalCard>
    </ModalOverlay>
  )
}
