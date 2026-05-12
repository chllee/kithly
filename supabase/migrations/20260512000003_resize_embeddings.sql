-- Resize embeddings from 1536 (OpenAI) to 768 (Gemini text-embedding-004)

drop index if exists media_embeddings_embedding_idx;

alter table public.media_embeddings
  alter column embedding type vector(3072);

create index on public.media_embeddings using hnsw (embedding vector_cosine_ops);
