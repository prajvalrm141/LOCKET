import { Link, useLoaderData } from '@tanstack/react-router';
import { Heart, Image, Smile, PenTool, Calendar, BookOpen, Quote, ChevronRight, ExternalLink } from 'lucide-react';
import { cn, formatDate, truncate, yearsTogether, daysTogether } from '@/lib/utils';
import { PaperCard, ChapterCard, PolaroidStrip, EmptyState } from '@/components/ui';
import { readOccasionDetailRoute, readMoodDetailRoute, readFeelingDetailRoute } from '@/routes/__root';

interface ReadSpaceData {
  space: {
    id: string;
    title: string;
    dedication: string;
    herName: string;
    ownerName: string;
    shareToken: string;
    shareEnabled: boolean;
  } | null;
  occasions: any[];
  moods: any[];
  feelings: any[];
  quotes: any[];
  anniversary: any;
  anniversaryMoments: any[];
  keepEvents: any[];
  wallpapers: any[];
}

function getWallpaper(pageKey: string, wallpapers: any[]) {
  return wallpapers.find(w => w.pageKey === pageKey)?.imageData;
}

export function ReadHomePage() {
  const { space, occasions, moods, feelings, quotes, anniversary, wallpapers } = useLoaderData();
  const bgImage = getWallpaper('home', wallpapers);

  const recentPhotos = occasions.flatMap((o: any) => o.photos).slice(0, 6);
  const latestFeeling = feelings[0];
  const latestQuote = quotes[0];

  const isEmpty = !occasions.length && !moods.length && !feelings.length && !quotes.length && !anniversary;

  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <EmptyState
          icon={Heart}
          title="This keep is empty"
          description="There are no memories here yet. The owner hasn't added anything to share."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-ink">{space?.title || 'A Keep'}</h1>
            <p className="font-sans text-ink-soft italic mt-1">{space?.dedication || 'A keep, left for you'}</p>
            <p className="text-sm text-muted mt-2">From {space?.ownerName || 'Me'} to {space?.herName || 'Her'}</p>
          </div>
        </div>

        {anniversary && (
          <div className="paper-card p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-rose" />
              </div>
              <div>
                <p className="font-display text-lg font-medium text-ink">{anniversary.title}</p>
                <p className="text-sm text-muted">
                  {yearsTogether(anniversary.happenedOn)} years Â· {daysTogether(anniversary.happenedOn)} days together
                </p>
              </div>
            </div>
            <p className="text-ink-soft italic text-sm md:text-base leading-relaxed">{truncate(anniversary.letter, 200)}</p>
            <Link to="/anniversary" search={{ token: undefined }} className="inline-flex items-center gap-1 text-sm text-rose mt-3 hover:underline">
              <span>Read more</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <Link to="/feelings" search={{ token: undefined }} className="block">
          <div className="paper-card p-4 md:p-6 hover:shadow-paper-hover transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
                <PenTool className="w-6 h-6 text-rose" />
              </div>
              <div>
                <p className="font-display text-lg font-medium text-ink">Latest feeling</p>
                <p className="text-sm text-muted">{latestFeeling ? formatDate(latestFeeling.feltAt) : 'No feelings yet'}</p>
              </div>
            </div>
            <p className="text-ink-soft italic text-sm md:text-base leading-relaxed">
              {latestFeeling ? truncate(latestFeeling.body, 200) : 'No feelings written yet'}
            </p>
          </div>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-medium text-ink">Chapters</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
<ChapterCard
            icon={Image}
            title="Occasions"
            count={occasions.length}
            description="Days, trips, events"
            href="/occasions"
            search={{ token: undefined }}
            color="rose"
          />
          <ChapterCard
            icon={Smile}
            title="Moods"
            count={moods.length}
            description="Seasons, hours, feelings"
            href="/moods"
            search={{ token: undefined }}
            color="amber"
          />
          <ChapterCard
            icon={PenTool}
            title="Feelings"
            count={feelings.length}
            description="Dated letters with stamps"
            href="/feelings"
            search={{ token: undefined }}
            color="emerald"
          />
          <ChapterCard
            icon={Calendar}
            title="Timeline"
            count={occasions.length + moods.length + feelings.length}
            description="Automatic ledger"
            href="/timeline"
            search={{ token: undefined }}
            color="blue"
          />
          <ChapterCard
            icon={Heart}
            title="Anniversary"
            count={anniversary ? 1 : 0}
            description="Your special day"
            href="/anniversary"
            search={{ token: undefined }}
            color="pink"
          />
          <ChapterCard
            icon={Quote}
            title="Her words"
            count={quotes.length}
            description="Quotes she said"
            href="/quotes"
            search={{ token: undefined }}
            color="violet"
          />
        </div>
      </section>

      {recentPhotos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-medium text-ink">Recent photographs</h2>
            <Link to="/occasions" search={{ token: undefined }} className="text-sm text-rose hover:underline">View all</Link>
          </div>
          <PolaroidStrip photos={recentPhotos} />
        </section>
      )}

      {latestQuote && (
        <section>
          <h2 className="font-display text-xl font-medium text-ink mb-4">Latest from her words</h2>
          <div className="paper-card p-5">
            <blockquote className="font-display italic text-lg text-ink-soft relative pl-4 border-l-2 border-rose">
              &ldquo;{latestQuote.body}&rdquo;
              {latestQuote.context && <cite className="block font-sans not-italic text-sm text-muted mt-2">â€” {latestQuote.context}</cite>}
            </blockquote>
            <Link to="/quotes" search={{ token: undefined }} className="inline-flex items-center gap-1 text-sm text-rose mt-3 hover:underline">
              <span>View all</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export function ReadOccasionsPage() {
  const { occasions, wallpapers, space } = useLoaderData();
  const bgImage = getWallpaper('occasions', wallpapers);

  if (occasions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
        <h1 className="font-display text-2xl font-medium text-ink">Occasions</h1>
        <EmptyState
          icon={Image}
          title="No occasions shared"
          description="The owner hasn't added any occasions to share yet."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <h1 className="font-display text-2xl font-medium text-ink">Occasions</h1>
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {occasions.map((occasion: any) => (
          <ReadOccasionCard key={occasion.id} occasion={occasion} token={space.shareToken} />
        ))}
      </div>
    </div>
  );
}

function ReadOccasionCard({ occasion, token }: { occasion: any; token: string }) {
  const coverPhoto = occasion.photos?.[0]?.imageData || occasion.coverPhoto;

  return (
    <Link
      to={readOccasionDetailRoute.to}
      params={{ occasionId: occasion.id, token }}
      search={{ edit: undefined }}
      className="paper-card hover group overflow-hidden h-full flex flex-col"
    >
      {coverPhoto && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={coverPhoto} alt={occasion.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-medium text-ink truncate">{occasion.title}</h3>
        <p className="text-sm text-muted mt-1 flex-1">{occasion.note ? truncate(occasion.note, 100) : 'No note'}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink/10">
          <span className="text-xs text-muted">{occasion.photos?.length || 0} photos</span>
          {occasion.date && <span className="text-xs text-muted ml-auto">{formatDate(occasion.date)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ReadMoodsPage() {
  const { moods, wallpapers, space } = useLoaderData();
  const bgImage = getWallpaper('moods', wallpapers);

  if (moods.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
        <h1 className="font-display text-2xl font-medium text-ink">Moods</h1>
        <EmptyState
          icon={Smile}
          title="No moods shared"
          description="The owner hasn't added any moods to share yet."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <h1 className="font-display text-2xl font-medium text-ink">Moods</h1>
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {moods.map((mood: any) => (
          <ReadMoodCard key={mood.id} mood={mood} token={space.shareToken} />
        ))}
      </div>
    </div>
  );
}

function ReadMoodCard({ mood, token }: { mood: any; token: string }) {
  const coverPhoto = mood.photos?.[0]?.imageData || mood.coverPhoto;

  return (
    <Link
      to={readMoodDetailRoute.to}
      params={{ moodId: mood.id, token }}
      search={{ edit: undefined }}
      className="paper-card hover group overflow-hidden h-full flex flex-col"
    >
      {coverPhoto && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={coverPhoto} alt={mood.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-medium text-ink truncate">{mood.title}</h3>
        <p className="text-sm text-muted mt-1 flex-1">{mood.note ? truncate(mood.note, 100) : 'No note'}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink/10">
          <span className="text-xs text-muted">{mood.photos?.length || 0} photos</span>
        </div>
      </div>
    </Link>
  );
}

export function ReadFeelingsPage() {
  const { feelings, wallpapers, space } = useLoaderData();
  const bgImage = getWallpaper('feelings', wallpapers);

  if (feelings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
        <h1 className="font-display text-2xl font-medium text-ink">Feelings</h1>
        <EmptyState
          icon={PenTool}
          title="No feelings shared"
          description="The owner hasn't written any feelings to share yet."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <h1 className="font-display text-2xl font-medium text-ink">Feelings</h1>
<div className="space-y-4">
        {feelings.map((feeling: any) => (
          <ReadFeelingCard key={feeling.id} feeling={feeling} token={space.shareToken} />
        ))}
      </div>
    </div>
  );
}

function ReadFeelingCard({ feeling, token }: { feeling: any; token: string }) {
  return (
    <Link
      to={readFeelingDetailRoute.to}
      params={{ feelingId: feeling.id, token }}
      className="paper-card hover group"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose/10 flex items-center justify-center">
            <PenTool className="w-6 h-6 text-rose" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-ink-soft leading-relaxed whitespace-pre-wrap">{feeling.body}</p>
            {feeling.stampData && (
              <img src={feeling.stampThumb || feeling.stampData} alt="Stamp" className="w-20 h-20 object-cover rounded-lg shadow-paper mt-3" />
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted">
              <span>{formatDate(feeling.feltAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ReadTimelinePage() {
  const { keepEvents, wallpapers } = useLoaderData<any>() as any;
  const events = keepEvents as Array<{happenedAt:string;[k:string]:any}>;
  const bgImage = getWallpaper('timeline', wallpapers);

  const eventsByDay = events.reduce((acc: Record<string, any[]>, event: any) => {
    const day = new Date(event.happenedAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const sortedDays = Object.entries(eventsByDay).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <h1 className="font-display text-2xl font-medium text-ink">Timeline</h1>
      <p className="text-muted">A gentle ledger of moments kept</p>

      {sortedDays.length === 0 && (
        <PaperCard className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted mb-4" />
          <h3 className="font-display text-lg font-medium text-ink mb-2">Timeline is empty</h3>
          <p className="text-muted">No events have been recorded yet.</p>
        </PaperCard>
      )}

      <div className="space-y-8">
        {sortedDays.map(([day, events]: [string, any[]]) => (
          <ReadTimelineDay key={day} day={day} events={events} />
        ))}
      </div>
    </div>
  );
}

function ReadTimelineDay({ day, events }: { day: string; events: any[] }) {
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
          <ReadTimelineEventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function ReadTimelineEventCard({ event }: { event: any }) {
  const icons: Record<string, any> = {
    occasion_opened: Image,
    mood_named: Smile,
    photo_kept: Image,
    letter_written: PenTool,
    quote_kept: Quote,
    anniversary_tended: Heart,
    moment_added: Heart,
    wallpaper_set: Image,
    opening_words_tended: PenTool,
  };
  const labels: Record<string, string> = {
    occasion_opened: 'Occasion created',
    mood_named: 'Mood named',
    photo_kept: 'Photo kept',
    letter_written: 'Letter written',
    quote_kept: 'Quote kept',
    anniversary_tended: 'Anniversary tended',
    moment_added: 'Moment added',
    wallpaper_set: 'Wallpaper set',
    opening_words_tended: 'Opening words tended',
  };
  const Icon = icons[event.kind] || Calendar;
  const label = labels[event.kind] || 'Event';
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
          {event.thumbData && <img src={event.thumbData} alt="" className="w-20 h-20 object-cover rounded-lg mt-2 shadow-paper" />}
        </div>
      </div>
    </PaperCard>
  );
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function ReadAnniversaryPage() {
  const { anniversary, anniversaryMoments, wallpapers } = useLoaderData();
  const bgImage = getWallpaper('anniversary', wallpapers);

  if (!anniversary) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
        <h1 className="font-display text-2xl font-medium text-ink">Anniversary</h1>
        <EmptyState
          icon={Heart}
          title="No anniversary shared"
          description="The owner hasn't set up an anniversary page yet."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <PaperCard className="p-5 md:p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-8 h-8 text-rose" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">{anniversary.title}</h2>
            <p className="text-muted">{yearsTogether(anniversary.happenedOn)} years Â· {daysTogether(anniversary.happenedOn)} days together</p>
            <p className="text-sm text-muted">{formatDate(anniversary.happenedOn, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        {anniversary.coverPhoto && (
          <img src={anniversary.coverPhoto} alt={anniversary.title} className="w-full max-h-64 object-cover rounded-lg shadow-paper mb-4" />
        )}
        <div className="prose prose-ink max-w-none">
          <p className="font-sans text-ink-soft leading-relaxed whitespace-pre-wrap">{anniversary.letter}</p>
        </div>
      </PaperCard>

      {anniversaryMoments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-medium text-ink">Moments</h3>
          {anniversaryMoments.map((moment: any) => (
            <ReadMomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReadMomentCard({ moment }: { moment: any }) {
  return (
    <PaperCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose/10 flex items-center justify-center flex-shrink-0">
          <span className="font-display text-sm font-medium text-rose">Year {moment.year}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-base font-medium text-ink">{moment.title}</h4>
          <p className="text-sm text-ink-soft mt-1">{moment.body}</p>
          {moment.date && <p className="text-xs text-muted mt-1">{formatDate(moment.date)}</p>}
          {moment.photoData && (
            <img src={moment.photoThumb || moment.photoData} alt="" className="w-24 h-24 object-cover rounded-lg shadow-paper mt-2" />
          )}
        </div>
      </div>
    </PaperCard>
  );
}

export function ReadQuotesPage() {
  const { quotes, space, wallpapers } = useLoaderData();
  const bgImage = getWallpaper('quotes', wallpapers);

  if (quotes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
        <h1 className="font-display text-2xl font-medium text-ink">{space?.herName ? `What ${space.herName} said` : 'Her words'}</h1>
        <EmptyState
          icon={Quote}
          title="No quotes shared"
          description="The owner hasn't saved any quotes to share yet."
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up" style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}>
      <h1 className="font-display text-2xl font-medium text-ink">
        {space?.herName ? `What ${space.herName} said` : 'Her words'}
      </h1>
      <div className="space-y-4">
        {quotes.map((quote: any) => (
          <ReadQuoteCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
}

function ReadQuoteCard({ quote }: { quote: any }) {
  return (
    <PaperCard hover className="group">
      <div className="p-5">
        <blockquote className="font-display italic text-lg md:text-xl text-ink-soft leading-relaxed relative">
          <span className="text-rose opacity-30">&#8220;</span>
          {quote.body}
          <span className="text-rose opacity-30">&#8221;</span>
        </blockquote>
        {(quote.context || quote.saidOn) && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ink/10">
            {quote.context && <cite className="font-sans not-italic text-sm text-muted">â€” {quote.context}</cite>}
            {quote.saidOn && <time className="text-xs text-muted">{formatDate(quote.saidOn)}</time>}
          </div>
        )}
      </div>
    </PaperCard>
  );
}
