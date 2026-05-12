import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const VISION_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
]

async function describeImage(imageBase64, mimeType) {
  let lastError
  for (const model of VISION_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { text: 'Describe this photo in 2-3 sentences. Focus on what is happening, who or what is in the photo, the setting, and the mood. Be specific and descriptive.' },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        }],
      })
      console.log(`Vision model used: ${model}`)
      return result.text
    } catch (err) {
      const status = err?.errorDetails?.[0]?.reason ?? err?.message ?? ''
      if (status.includes('503') || status.includes('UNAVAILABLE') || status.includes('503')) {
        console.warn(`${model} unavailable, trying next…`)
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError
}

async function embedText(text) {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 3072 },
  })
  return result.embeddings[0].values
}

app.post('/process-media', async (req, res) => {
  const { mediaId } = req.body
  if (!mediaId) return res.status(400).json({ error: 'mediaId required' })

  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('id, type, storage_path, caption, media_tags(tag)')
    .eq('id', mediaId)
    .single()

  if (mediaError || !media) return res.status(404).json({ error: 'Media not found' })

  if (media.type !== 'photo') {
    return res.json({ skipped: true, reason: 'video embeddings deferred' })
  }

  const { data: urlData, error: urlError } = await supabase.storage
    .from('media')
    .createSignedUrl(media.storage_path, 60)

  if (urlError) return res.status(500).json({ error: 'Could not create signed URL' })

  const imageResponse = await fetch(urlData.signedUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  const imageBase64 = Buffer.from(imageBuffer).toString('base64')
  const mimeType = imageResponse.headers.get('content-type') ?? 'image/jpeg'

  const description = await describeImage(imageBase64, mimeType)

  const tags = media.media_tags.map(t => t.tag).join(', ')
  const embeddingInput = [
    description,
    media.caption ? `Caption: ${media.caption}` : null,
    tags ? `Tags: ${tags}` : null,
  ].filter(Boolean).join('\n')

  const embedding = await embedText(embeddingInput)

  const { error: insertError } = await supabase
    .from('media_embeddings')
    .upsert({ media_id: mediaId, embedding, model: 'gemini-embedding-001' })

  if (insertError) return res.status(500).json({ error: insertError.message })

  res.json({ success: true, description })
})

app.post('/reprocess-all', async (req, res) => {
  const { data: existing } = await supabase.from('media_embeddings').select('media_id')
  const existingIds = (existing ?? []).map(r => r.media_id)

  let query = supabase.from('media').select('id').eq('type', 'photo').is('deleted_at', null)
  if (existingIds.length > 0) query = query.not('id', 'in', `(${existingIds.join(',')})`)
  const { data: unprocessed, error } = await query

  if (error) return res.status(500).json({ error: error.message })
  if (!unprocessed?.length) return res.json({ message: 'Nothing to reprocess', count: 0 })

  res.json({ message: `Queued ${unprocessed.length} photo(s) for reprocessing` })

  for (const { id } of unprocessed) {
    try {
      const resp = await fetch(`http://localhost:${process.env.PORT ?? 3001}/process-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: id }),
      })
      if (resp.ok) {
        console.log(`Reprocessed ${id}`)
      } else {
        const body = await resp.json().catch(() => ({}))
        console.error(`Failed to reprocess ${id}: HTTP ${resp.status}`, body.error ?? '')
      }
    } catch (err) {
      console.error(`Failed to reprocess ${id}:`, err.message)
    }
  }
})

app.post('/search', async (req, res) => {
  const { query, eventId, userId } = req.body
  if (!query || !userId) return res.status(400).json({ error: 'query and userId required' })

  const queryEmbedding = await embedText(query)

  const rpcParams = { query_embedding: queryEmbedding, user_id: userId, match_count: 20 }
  if (eventId) rpcParams.event_id = eventId

  const { data: results, error } = await supabase.rpc(
    eventId ? 'search_media_in_event' : 'search_media',
    rpcParams
  )

  if (error) return res.status(500).json({ error: error.message })

  res.json({ results })
})

const port = process.env.PORT ?? 3001
app.listen(port, () => console.log(`Server running on port ${port}`))
