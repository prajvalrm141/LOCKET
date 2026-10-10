import { useLoaderData } from '@/hooks/useLoaderData';
import { Calendar, Image, Smile, PenTool, Quote, Heart, Clock } from 'lucide-react';
import { cn, formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { PaperCard, PolaroidStrip } from '@/components/ui';

interface TimelineEvent {
  id: string;
  kind: string;
  refId: string | null;
  title: string;
  bodyExcerpt: string | null;
  thumbData: string | null;
  href: string;
  happenedAt: string;
}

function getEventIcon(kind: string) {
  switch (kind) {
    case 'occasion_opened': return Image;
    case 'mood_named': return Smile;
    case 'photo_kept': return Image;
    case 'letter_written': return PenTool;
    case 'quote_kept': return Quote;
    case 'anniversary_tended': return Heart;
    case 'moment_added': return Heart;
    case 'wallpaper_set': return Image;
    case 'opening_words_tended': return PenTool;
    default: return Clock;
  }
}

function getEventLabel(kind: string) {
  switch (kind) {
    case 'occasion_opened': return 'Occasion created';
    case 'mood_named': return 'Mood named';
    case 'photo_kept': return 'Photo kept';
    case 'letter_written': return 'Letter written';
    case 'quote_kept': return 'Quote kept';
    case 'anniversary_tended': return 'Anniversary tended';
    case 'moment_added': return 'Moment added';
    case 'wallpaper_set': return 'Wallpaper set';
    case 'opening_words_tended': return 'Opening words tended';
    default: return 'Event';
  }
}

export function TimelinePage() {
  const { keepEvents, wallpapers } = useLoaderData();
  const events = keepEvents as TimelineEvent[];
  
  const eventsByDay = events.reduce((acc: Record<string, TimelineEvent[]>, event: TimelineEvent) => {
    const day = new Date(event.happenedAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.entries(eventsByDay).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <h1 className="font-display text-2xl font-medium text-ink">Timeline</h1>
      <p className="text-muted">Automatic ledger of every keep action, grouped by day</p>

      {sortedDays.length === 0 && (
        <PaperCard className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted mb-4" />
          <h3 className="font-display text-lg font-medium text-ink mb-2">Timeline is empty</h3>
          <p className="text-muted">As you add occasions, moods, feelings, and quotes, they'll appear here automatically.</p>
        </PaperCard>
      )}

      <div className="space-y-8">
        {sortedDays.map(([day, events]) => (
          <TimelineDay key={day} day={day} events={events} />
        ))}
      </div>
    </div>
  );
}

function TimelineDay({ day, events }: { day: string; events: TimelineEvent[] }) {
  const date = new Date(day);
  const photoEvents = events.filter(e => e.kind === 'photo_kept' && e.thumbData);
  const glances = photoEvents.slice(0, 6).map(e => e.thumbData!);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-paper-deep flex items-center justify-center flex-shrink-0">
          <span className="font-display text-lg font-medium text-ink">{date.getDate()}</span>
        </div>
        <div>
          <p className="font-display text-lg font-medium text-ink">{formatDate(date, { weekday: 'long', month: 'long', year: 'numeric' })}</p>
          <p className="text-sm text-muted">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {glances.length > 0 && (
        <PolaroidStrip photos={glances.map((thumbData, i) => ({ id: `glance-${i}`, imageData: thumbData, thumbData, createdAt: day }))} />
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const Icon = getEventIcon(event.kind);
  const label = getEventLabel(event.kind);
  const time = new Date(event.happenedAt);

  return (
    <PaperCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-rose" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-ink">{event.title}</span>
            <span className="text-xs text-muted">{label}</span>
            <span className="text-xs text-muted ml-auto">{timeAgo(time)}</span>
          </div>
          {event.bodyExcerpt && <p className="text-sm text-ink-soft">{event.bodyExcerpt}</p>}
          {event.thumbData && (
            <img src={event.thumbData} alt="" className="w-20 h-20 object-cover rounded-lg mt-2 shadow-paper" />
          )}
        </div>
      </div>
    </PaperCard>
  );
}
