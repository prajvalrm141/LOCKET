import { useParams, useLoaderData } from '@/hooks/useLoaderData';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Image, ChevronLeft, ChevronRight, Download, Heart } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PaperCard, PolaroidStrip, Lightbox } from '@/components/ui';

export function ReadOccasionDetailPage() {
  const { occasionId } = useParams();
  const { occasion, wallpapers } = useLoaderData();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const bgImage = wallpapers.find((w: any) => w.pageKey === `occasion-${occasionId}`)?.imageData || wallpapers.find((w: any) => w.pageKey === 'occasions')?.imageData;

  if (!occasion) return <div className="max-w-3xl mx-auto p-8 text-center">Occasion not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <Link to="/occasions" search={{ token: undefined }} className="inline-flex items-center gap-2 text-sm text-rose hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to occasions
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">{occasion.title}</h1>
          {occasion.note && <p className="text-muted mt-1">{occasion.note}</p>}
          {occasion.date && <p className="text-sm text-muted mt-1">{formatDate(occasion.date)}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {occasion.photos.map((photo: any, index: number) => (
          <ReadPhotoCard key={photo.id} photo={photo} onOpenLightbox={() => setLightboxIndex(index)} />
        ))}
      </div>

      <Lightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        src={occasion.photos[lightboxIndex!]?.imageData}
        alt={occasion.photos[lightboxIndex!]?.caption}
        caption={occasion.photos[lightboxIndex!]?.caption}
      />
    </div>
  );
}

function ReadPhotoCard({ photo, onOpenLightbox }: any) {
  return (
    <PaperCard hover className="group relative" onClick={onOpenLightbox}>
      <div className="relative aspect-square overflow-hidden">
        <img src={photo.imageData} alt={photo.caption || 'Photo'} className="w-full h-full object-cover" loading="lazy" />
      </div>
      {photo.caption && <div className="p-3 text-center text-sm text-ink-soft">{photo.caption}</div>}
      <div className="p-3 border-t border-ink/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-muted">{photo.caption ? 'View' : ''}</span>
      </div>
      <button className="absolute inset-0" onClick={onOpenLightbox} aria-label="View full size" />
    </PaperCard>
  );
}

export function ReadMoodDetailPage() {
  const { moodId } = useParams();
  const { mood, wallpapers } = useLoaderData();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const bgImage = wallpapers.find((w: any) => w.pageKey === `mood-${moodId}`)?.imageData || wallpapers.find((w: any) => w.pageKey === 'moods')?.imageData;

  if (!mood) return <div className="max-w-3xl mx-auto p-8 text-center">Mood not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <Link to="/moods" search={{ token: undefined }} className="inline-flex items-center gap-2 text-sm text-rose hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to moods
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">{mood.title}</h1>
          {mood.note && <p className="text-muted mt-1">{mood.note}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mood.photos.map((photo: any, index: number) => (
          <ReadPhotoCard key={photo.id} photo={photo} onOpenLightbox={() => setLightboxIndex(index)} />
        ))}
      </div>

      <Lightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        src={mood.photos[lightboxIndex!]?.imageData}
        alt={mood.photos[lightboxIndex!]?.caption}
        caption={mood.photos[lightboxIndex!]?.caption}
      />
    </div>
  );
}

export function ReadFeelingDetailPage() {
  const { feelingId } = useParams();
  const { feeling, wallpapers } = useLoaderData();
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const bgImage = wallpapers.find((w: any) => w.pageKey === 'feelings')?.imageData;

  if (!feeling) return <div className="max-w-3xl mx-auto p-8 text-center">Feeling not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <Link to="/feelings" search={{ token: undefined }} className="inline-flex items-center gap-2 text-sm text-rose hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to feelings
      </Link>

      <PaperCard className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose/10 flex items-center justify-center">
            <Image className="w-6 h-6 text-rose" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-ink-soft leading-relaxed whitespace-pre-wrap">{feeling.body}</p>
            {feeling.stampData && (
              <button className="mt-3 inline-block" onClick={() => setLightboxPhoto(feeling.stampData)}>
                <img src={feeling.stampThumb || feeling.stampData} alt="Stamp" className="w-24 h-24 object-cover rounded-lg shadow-paper" />
              </button>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted">
              <span>{formatDate(feeling.feltAt)}</span>
            </div>
          </div>
        </div>
      </PaperCard>

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Stamp" />
    </div>
  );
}