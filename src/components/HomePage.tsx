import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLoaderData } from '@/hooks/useLoaderData';
import { Heart, Image, Smile, PenTool, Calendar, BookOpen, Quote, Plus, Settings, Copy, RotateCw, Pause, Play, ExternalLink, Trash2, Edit2, ChevronRight, Share2, X } from 'lucide-react';
import { cn, formatDate, truncate, yearsTogether, daysTogether } from '@/lib/utils';
import { PaperCard, PolaroidStrip, ChapterCard, EmptyState, Modal, Textarea, Input, Button } from '@/components/ui';
import type { SpaceData } from '@/routes/__root';

interface HomePageProps {
  space: SpaceData['space'];
}

export function HomePage({ space }: HomePageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { occasions, moods, feelings, quotes, anniversary, wallpapers } = useLoaderData();
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [editDedication, setEditDedication] = useState(false);
  const [dedicationData, setDedicationData] = useState({
    title: space?.title || '',
    dedication: space?.dedication || '',
    herName: space?.herName || '',
    ownerName: space?.ownerName || '',
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async (data: typeof dedicationData) => {
      const res = await fetch('/api/space/mutations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space'] });
      setEditDedication(false);
    },
  });

  const toggleShareMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/space/mutations?action=toggle-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['space'] }),
  });

  const rotateTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/space/mutations?action=rotate-token', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['space'] }),
  });

  const handleSaveDedication = () => {
    updateSpaceMutation.mutate(dedicationData);
  };

  const recentPhotos = occasions.flatMap((o: any) => o.photos).slice(0, 6);
  const latestFeeling = feelings[0];
  const latestQuote = quotes[0];

  const isEmpty = !occasions.length && !moods.length && !feelings.length && !quotes.length && !anniversary;

  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <EmptyState
          icon={Heart}
          title="Your keep is empty"
          description="Start by adding an occasion, a mood, a feeling, or a quote. Each memory becomes a page in your story."
          action={<Button onClick={() => navigate({ to: '/occasions', search: { token: undefined } })}>Create first occasion</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            {editDedication ? (
              <div className="space-y-3">
                <Input
                  value={dedicationData.title}
                  onChange={(e) => setDedicationData((d: typeof dedicationData) => ({ ...d, title: e.target.value }))}
                  placeholder="Keep title"
                  className="font-display text-2xl font-medium bg-transparent border-none focus:ring-0 text-ink"
                />
                <Textarea
                  value={dedicationData.dedication}
                  onChange={(e) => setDedicationData((d: typeof dedicationData) => ({ ...d, dedication: e.target.value }))}
                  placeholder="A dedication letter..."
                  rows={3}
                  className="font-sans text-base bg-transparent border-none focus:ring-0 text-ink-soft resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={dedicationData.herName}
                    onChange={(e) => setDedicationData((d: typeof dedicationData) => ({ ...d, herName: e.target.value }))}
                    placeholder="Her name"
                  />
                  <Input
                    value={dedicationData.ownerName}
                    onChange={(e) => setDedicationData((d: typeof dedicationData) => ({ ...d, ownerName: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" onClick={() => setEditDedication(false)}>Cancel</Button>
                  <Button onClick={handleSaveDedication} disabled={updateSpaceMutation.isPending}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl md:text-4xl font-medium text-ink">{space?.title || 'Our Keep'}</h1>
                <p className="font-sans text-ink-soft italic mt-1">{space?.dedication || 'A keep, left for you'}</p>
                <p className="text-sm text-muted mt-2">From {space?.ownerName || 'Me'} to {space?.herName || 'Her'}</p>
              </>
            )}
          </div>
          {!editDedication && (
            <button className="btn-ghost p-2" onClick={() => setEditDedication(true)} aria-label="Edit dedication">
              <Edit2 className="w-5 h-5" />
            </button>
          )}
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
              {latestFeeling ? truncate(latestFeeling.body, 200) : 'Write your first feeling...'}
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
            search={{}}
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

      <SharePanel 
        space={space!} 
        show={showSharePanel} 
        onClose={() => setShowSharePanel(false)}
        onToggleShare={(enabled) => toggleShareMutation.mutate(enabled)}
        onRotateToken={() => rotateTokenMutation.mutate()}
        toggling={toggleShareMutation.isPending}
        rotating={rotateTokenMutation.isPending}
      />
    </div>
  );
}

function SharePanel({ space, show, onClose, onToggleShare, onRotateToken, toggling, rotating }: {
  space: SpaceData['space'];
  show: boolean;
  onClose: () => void;
  onToggleShare: (enabled: boolean) => void;
  onRotateToken: () => void;
  toggling: boolean;
  rotating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/for-you/${space?.shareToken}`;

  if (!show) return (
    <Button variant="secondary" className="w-full md:w-auto" onClick={() => onClose()}>
      <Share2 className="w-4 h-4 mr-2" /> Share keep
    </Button>
  );

  return (
    <div className="paper-card p-5 border-rose/20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-medium text-ink">Share your keep</h3>
        <button className="btn-ghost p-1" onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      <p className="text-sm text-muted mb-4">Copy this link to share with {space?.herName}. Only this URL works for her.</p>
      <div className="flex gap-2 mb-3">
        <input 
          type="text" 
          value={shareUrl} 
          readOnly 
          className="input flex-1 text-xs"
        />
        <Button 
          onClick={async () => {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          variant="secondary"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <p className="text-xs text-rose/80 bg-rose/5 p-2 rounded mb-4">âš  Private preview links don't work for her. Only /for-you/... URLs are shareable.</p>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={space?.shareEnabled ? 'primary' : 'secondary'} 
          onClick={() => onToggleShare(!space?.shareEnabled)}
          disabled={toggling}
        >
          {space?.shareEnabled ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {space?.shareEnabled ? 'Pause sharing' : 'Enable sharing'}
        </Button>
        <Button variant="ghost" onClick={onRotateToken} disabled={rotating}>
          <RotateCw className="w-4 h-4 mr-1" /> Rotate token
        </Button>
        <Button variant="ghost" onClick={() => window.open(shareUrl, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-1" /> Preview
        </Button>
      </div>
    </div>
  );
}
