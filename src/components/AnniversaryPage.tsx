import { useState } from 'react';
import { useLoaderData } from '@/hooks/useLoaderData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Calendar, PenTool, Plus, Trash2, Edit2, Image, GripVertical } from 'lucide-react';
import { cn, formatDate, yearsTogether, daysTogether } from '@/lib/utils';
import { PaperCard, Button, Modal, Input, Textarea, EmptyState, Lightbox } from '@/components/ui';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';

export function AnniversaryPage() {
  const queryClient = useQueryClient();
  const { anniversary, anniversaryMoments } = useLoaderData() as any;
  const [showForm, setShowForm] = useState<'anniversary' | 'moment' | null>(null);
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);
  const [anniversaryData, setAnniversaryData] = useState({
    title: anniversary?.title || 'Our Anniversary',
    happenedOn: anniversary?.happenedOn ? new Date(anniversary.happenedOn).toISOString().split('T')[0] : '',
    letter: anniversary?.letter || '',
    coverPhoto: anniversary?.coverPhoto || '',
  });
  const [momentData, setMomentData] = useState({ title: '', body: '', year: new Date().getFullYear(), date: '', photoData: '', photoThumb: '' });
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const upsertAnniversaryMutation = useMutation({
    mutationFn: async (data: typeof anniversaryData) => {
      const res = await fetch('/api/anniversary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversary'] });
      setShowForm(null);
    },
  });

  const createMomentMutation = useMutation({
    mutationFn: async (data: typeof momentData) => {
      const res = await fetch('/api/anniversary?action=moment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversary'] });
      setShowForm(null);
    },
  });

  const updateMomentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof momentData }) => {
      const res = await fetch(`/api/anniversary?id=${id}&action=moment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversary'] });
      setEditingMomentId(null);
    },
  });

  const deleteMomentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/anniversary?id=${id}&action=moment`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['anniversary'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/anniversary/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['anniversary'] }),
  });

  const handleAnniversarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertAnniversaryMutation.mutate(anniversaryData);
  };

  const handleMomentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMomentId) {
      updateMomentMutation.mutate({ id: editingMomentId, data: momentData });
    } else {
      createMomentMutation.mutate(momentData);
    }
  };

  const startEditMoment = (moment: any) => {
    setEditingMomentId(moment.id);
    setMomentData({
      title: moment.title,
      body: moment.body,
      year: moment.year,
      date: moment.date ? new Date(moment.date).toISOString().split('T')[0] : '',
      photoData: moment.photoData || '',
      photoThumb: moment.photoThumb || '',
    });
    setShowForm('moment');
  };

  const onMomentDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    const imageData = await compressImage(file);
    const thumbData = await createThumbnail(imageData);
    setMomentData(d => ({ ...d, photoData: imageData, photoThumb: thumbData }));
  };

  const onAnniversaryDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    const imageData = await compressImage(file);
    setAnniversaryData(d => ({ ...d, coverPhoto: imageData }));
  };

  const { getRootProps: getMomentDropProps, getInputProps: getMomentInputProps, isDragActive: momentDragActive } = useDropzone({ onDrop: onMomentDrop, accept: { 'image/*': [] }, maxFiles: 1 });
  const { getRootProps: getAnniversaryDropProps, getInputProps: getAnniversaryInputProps, isDragActive: anniversaryDragActive } = useDropzone({ onDrop: onAnniversaryDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <h1 className="font-display text-2xl font-medium text-ink">Anniversary</h1>

      {!anniversary && !showForm && (
        <PaperCard className="p-8">
          <EmptyState
            icon={Heart}
            title="No anniversary set"
            description="Set your special day and write a letter. Add moments for each year together."
            action={<Button onClick={() => setShowForm('anniversary')}>Set anniversary</Button>}
          />
        </PaperCard>
      )}

      {anniversary && (
        <AnniversaryCard
          anniversary={anniversary}
          moments={anniversaryMoments}
          onEdit={() => { setAnniversaryData({ title: anniversary.title, happenedOn: new Date(anniversary.happenedOn).toISOString().split('T')[0], letter: anniversary.letter, coverPhoto: anniversary.coverPhoto || '' }); setShowForm('anniversary'); }}
          onAddMoment={() => { setMomentData({ title: '', body: '', year: new Date().getFullYear(), date: '', photoData: '', photoThumb: '' }); setShowForm('moment'); }}
          onEditMoment={startEditMoment}
          onDeleteMoment={(id: string) => deleteMomentMutation.mutate(id)}
          onOpenPhoto={(src: string) => setLightboxPhoto(src)}
        />
      )}

      {showForm === 'anniversary' && (
        <AnniversaryForm
          data={anniversaryData}
          setData={setAnniversaryData}
          onSubmit={handleAnniversarySubmit}
          onCancel={() => setShowForm(null)}
          isPending={upsertAnniversaryMutation.isPending}
          isDragActive={anniversaryDragActive}
          onDrop={getAnniversaryDropProps}
        />
      )}

      {(showForm === 'moment' || editingMomentId) && (
        <MomentForm
          data={momentData}
          setData={setMomentData}
          onSubmit={handleMomentSubmit}
          onCancel={() => { setShowForm(null); setEditingMomentId(null); }}
          isPending={editingMomentId ? updateMomentMutation.isPending : createMomentMutation.isPending}
          isDragActive={momentDragActive}
          onDrop={getMomentDropProps}
        />
      )}

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Photo" />
    </div>
  );
}

function AnniversaryCard({ anniversary, moments, onEdit, onAddMoment, onEditMoment, onDeleteMoment, onOpenPhoto }: any) {
  return (
    <div className="space-y-6">
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
        <div className="flex gap-2 mt-6 pt-4 border-t border-ink/10">
          <Button variant="ghost" onClick={onEdit}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
          <Button variant="secondary" onClick={onAddMoment}><Plus className="w-4 h-4 mr-1" /> Add moment</Button>
        </div>
      </PaperCard>

      {moments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-medium text-ink">Moments</h3>
          {moments.map((moment: any) => (
            <MomentCard key={moment.id} moment={moment} onEdit={onEditMoment} onDelete={onDeleteMoment} onOpenPhoto={onOpenPhoto} />
          ))}
        </div>
      )}
    </div>
  );
}

function MomentCard({ moment, onEdit, onDelete, onOpenPhoto }: any) {
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
            <button className="mt-2" onClick={() => onOpenPhoto(moment.photoData)}>
              <img src={moment.photoThumb || moment.photoData} alt="" className="w-24 h-24 object-cover rounded-lg shadow-paper" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button className="btn-ghost p-1" onClick={() => onEdit(moment)}><Edit2 className="w-4 h-4" /></button>
          <button className="btn-ghost p-1" onClick={() => onDelete(moment.id)}><Trash2 className="w-4 h-4 text-rose" /></button>
        </div>
      </div>
    </PaperCard>
  );
}

function AnniversaryForm({ data, setData, onSubmit, onCancel, isPending, isDragActive, onDrop }: any) {
  return (
    <PaperCard className={cn('p-5', isDragActive && 'border-rose border-2')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          value={data.title}
          onChange={(e) => setData((d: typeof data) => ({ ...d, title: e.target.value }))}
          placeholder="Title"
        />
        <Input
          type="date"
          value={data.happenedOn}
          onChange={(e) => setData((d: typeof data) => ({ ...d, happenedOn: e.target.value }))}
          required
        />
        <Textarea
          value={data.letter}
          onChange={(e) => setData((d: typeof data) => ({ ...d, letter: e.target.value }))}
          placeholder="Write your anniversary letter..."
          rows={5}
        />
        <div className="border-2 border-dashed border-ink/10 rounded-lg p-4 text-center" {...onDrop}>
          <p className="text-sm text-muted mb-2">Drop cover photo or click to upload</p>
          <Input type="file" accept="image/*" hidden {...onDrop} />
          <Button type="button" variant="secondary" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
            <Image className="w-4 h-4 mr-2" /> Choose photo
          </Button>
          {data.coverPhoto && <img src={data.coverPhoto} alt="Preview" className="w-32 h-32 mx-auto mt-2 object-cover rounded-lg" />}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </PaperCard>
  );
}

function MomentForm({ data, setData, onSubmit, onCancel, isPending, isDragActive, onDrop }: any) {
  return (
    <PaperCard className={cn('p-5', isDragActive && 'border-rose border-2')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          value={data.title}
          onChange={(e) => setData((d: typeof data) => ({ ...d, title: e.target.value }))}
          placeholder="Moment title"
          required
        />
        <Textarea
          value={data.body}
          onChange={(e) => setData((d: typeof data) => ({ ...d, body: e.target.value }))}
          placeholder="What happened this year?"
          rows={3}
          required
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            type="number"
            value={data.year}
            onChange={(e) => setData((d: typeof data) => ({ ...d, year: parseInt(e.target.value) }))}
            placeholder="Year"
            min={1900}
            max={new Date().getFullYear() + 1}
          />
          <Input
            type="date"
            value={data.date}
            onChange={(e) => setData((d: typeof data) => ({ ...d, date: e.target.value }))}
          />
        </div>
        <div className="border-2 border-dashed border-ink/10 rounded-lg p-4 text-center" {...onDrop}>
          <p className="text-sm text-muted mb-2">Drop a photo or click to upload</p>
          <Input type="file" accept="image/*" hidden {...onDrop} />
          <Button type="button" variant="secondary" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
            <Image className="w-4 h-4 mr-2" /> Add photo
          </Button>
          {data.photoThumb && <img src={data.photoThumb} alt="Preview" className="w-24 h-24 mx-auto mt-2 object-cover rounded-lg" />}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </PaperCard>
  );
}
