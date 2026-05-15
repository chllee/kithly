import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import MediaItem from '../components/MediaItem'
import SearchBar from '../components/SearchBar'
import { PageWrapper, GlassCard, MutedText } from '../components/ui'

const SearchSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  input {
    background: rgba(255, 255, 255, 0.75);
  }

  @media (min-width: 640px) {
    max-width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
`

const EventCard = styled(GlassCard)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: 0;
  overflow: hidden;
`

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;

  @media (max-width: 639px) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`

const EventLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.sizeLg};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`

const EventMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};

  svg {
    width: 14px;
    height: 14px;
  }
`

const CarouselWrapper = styled.div`
  position: relative;
`

const CarouselTrack = styled.div`
  display: flex;
  overflow-x: ${({ $count }) => $count > 3 ? 'auto' : 'hidden'};
  justify-content: ${({ $count }) => $count > 3 ? 'flex-start' : 'center'};
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  gap: 2px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  ${({ $count }) => $count > 3 && `
    mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  `}

  @media (max-width: 639px) {
    overflow-x: ${({ $count }) => $count > 2 ? 'auto' : 'hidden'};
    justify-content: ${({ $count }) => $count > 2 ? 'flex-start' : 'center'};

    ${({ $count }) => $count > 2 ? `
      mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    ` : `
      mask-image: none;
      -webkit-mask-image: none;
    `}
  }
`

const PhotoSlide = styled.div`
  flex: 0 0 calc(33.3333% - 1.3334px);
  height: 220px;
  scroll-snap-align: start;
  cursor: pointer;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.border};

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.2s ease;
  }

  &:hover img, &:hover video {
    transform: scale(1.04);
  }

  @media (max-width: 639px) {
    flex: 0 0 calc(50% - 1px);
    height: 160px;
  }
`

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => $side === 'left' ? 'left: 10px;' : 'right: 10px;'}
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  color: ${({ theme }) => theme.colors.textDark};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    background: ${({ theme }) => theme.colors.bg};
  }

  svg { width: 18px; height: 18px; }

  @media (max-width: 639px) {
    width: 30px;
    height: 30px;
    svg { width: 15px; height: 15px; }
  }
`

function Carousel({ items, onSelect }) {
  const trackRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 1)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  function scroll(dir) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <CarouselWrapper>
      {canLeft && (
        <ArrowButton $side="left" onClick={() => scroll(-1)} aria-label="Scroll left">
          <ChevronLeft />
        </ArrowButton>
      )}
      <CarouselTrack ref={trackRef} $count={items.length}>
        {items.map(item => (
          <PhotoSlide key={item.id} onClick={() => onSelect(item)}>
            {item.type === 'photo'
              ? <img src={item.url} alt={item.caption ?? ''} />
              : <video src={item.url} />
            }
          </PhotoSlide>
        ))}
      </CarouselTrack>
      {canRight && (
        <ArrowButton $side="right" onClick={() => scroll(1)} aria-label="Scroll right">
          <ChevronRight />
        </ArrowButton>
      )}
    </CarouselWrapper>
  )
}

export default function FeedPage() {
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: mediaData, error } = await supabase
        .from('media')
        .select(`
          id, event_id, type, storage_path, caption, taken_at, latitude, longitude, uploaded_by, created_at,
          users!media_uploaded_by_fkey(first_name, last_name),
          events!inner(id, name, start_date, end_date, location)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error || !mediaData?.length) { setGroups([]); setLoading(false); return }

      const paths = mediaData.map(m => m.storage_path)
      const { data: urlData } = await supabase.storage.from('media').createSignedUrls(paths, 3600)
      const urlMap = Object.fromEntries(urlData.map(u => [u.path, u.signedUrl]))

      const byEvent = new Map()
      for (const m of mediaData) {
        if (!byEvent.has(m.event_id)) byEvent.set(m.event_id, { event: m.events, items: [] })
        byEvent.get(m.event_id).items.push({ ...m, url: urlMap[m.storage_path] })
      }

      setGroups([...byEvent.values()].sort((a, b) => b.event.start_date.localeCompare(a.event.start_date)))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <Nav />
      <PageWrapper>
        <SearchSection>
          <SearchBar />
        </SearchSection>

        {loading && <MutedText>Loading…</MutedText>}
        {!loading && groups.length === 0 && (
          <MutedText>No memories yet. Upload photos to one of your events to see them here.</MutedText>
        )}

        {groups.map(({ event, items }) => (
          <EventCard key={event.id}>
            <CardHeader>
              <EventLink to={`/events/${event.id}`}>{event.name}</EventLink>
              <EventMeta>
                <MetaItem>
                  <CalendarDays />
                  {event.start_date}{event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ''}
                </MetaItem>
                {event.location && (
                  <MetaItem>
                    <MapPin />
                    {event.location}
                  </MetaItem>
                )}
              </EventMeta>
            </CardHeader>

            <Carousel items={items} onSelect={setSelected} />
          </EventCard>
        ))}

        {selected && <MediaItem item={selected} onClose={() => setSelected(null)} />}
      </PageWrapper>
    </>
  )
}
