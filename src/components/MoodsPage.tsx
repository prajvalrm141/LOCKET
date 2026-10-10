import { useState } from 'react';
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Smile, Trash2, Edit2, Image, GripVertical } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PaperCard, Button, Modal, Input, Textarea, EmptyState, PolaroidStrip, Lightbox } from '@/components/ui';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';

export function MoodsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { moods } = useLoaderData();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', note: '' });
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; note?: string }) => {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/moods?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/moods?id=${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moods'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/moods/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moods'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title: editData.title, note: editData.note });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: { title: editData.title, note: editData.note } });
  };

  const startEdit = (mood: any) => {
    setEditingId(mood.id);
    setEditData({ title: mood.title, note: mood.note || '' });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!editingId) return;
    const files = await Promise.all(
      acceptedFiles.map(async (file) => {
        const validation = validateImageFile(file);
        if (!validation.valid) throw new Error(validation.error);
        const imageData = await compressImage(file);
        const thumbData = await createThumbnail(imageData);
        return { imageData, thumbData };
      })
    );
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumType: 'mood', albumId: editingId, files }),
    });
    const result = await res.json();
    if (result.success) queryClient.invalidateQueries({ queryKey: ['photos', editingId] });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 10 });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">Moods</h1>
        <Button onClick={() => { setEditData({ title: '', note: '' }); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New mood
        </Button>
      </div>

      {moods.length === 0 && !showCreate && (
        <EmptyState
          icon={Smile}
          title="No moods yet"
          description="Capture a season, an hour, a feeling — moods don't need dates, just names."
          action={<Button onClick={() => { setEditData({ title: '', note: '' }); setShowCreate(true); }}>Create mood</Button>}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" {...getRootProps()}>
        {getInputProps()}
        {moods.map((mood: any) => (
          <MoodCard
            key={mood.id}
            mood={mood}
            onEdit={startEdit}
            onDelete={() => deleteMutation.mutate(mood.id)}
            onClick={() => navigate({ to: `/moods/${mood.id}` })}
            queryClient={queryClient}
          />
        ))}
        {showCreate && (
          <MoodForm
            data={editData}
            setData={setEditData}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={createMutation.isPending}
            isDragActive={false}
            onDrop={() => {}}
            albumId=""
            queryClient={queryClient}
          />
        )}
        {editingId && (
          <MoodForm
            data={editData}
            setData={setEditData}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
            isPending={updateMutation.isPending}
            isDragActive={isDragActive}
            onDrop={getRootProps}
            albumId={editingId}
            queryClient={queryClient}
          />
        )}
      </div>

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Photo" />
    </div>
  );
}

function MoodCard({ mood, onEdit, onDelete, onClick, queryClient }: any) {
  const coverPhoto = mood.photos?.[0]?.imageData || mood.coverPhoto;

  return (
    <PaperCard hover className="group overflow-hidden h-full flex flex-col" onClick={onClick}>
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
      <div className="p-4 border-t border-ink/10 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onEdit(mood); }}><Edit2 className="w-4 h-4" /></button>
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-4 h-4 text-rose" /></button>
      </div>
    </PaperCard>
  );
}

function MoodForm({ data, setData, onSubmit, onCancel, isPending, isDragActive, onDrop, albumId, queryClient }: { data: any; setData: (d: any) => void; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isPending: boolean; isDragActive: boolean; onDrop: any; albumId: string; queryClient: any }) {
  return (
    <PaperCard className={cn('p-4 flex flex-col', isDragActive && 'border-rose border-2')}>
      <form onSubmit={onSubmit} className="space-y-3 flex-1">
        <Input
          value={data.title}
          onChange={(e) => setData((d: any) => ({ ...d, title: e.target.value }))}
          placeholder="Title (required)"
          required
        />
        <Textarea
          value={data.note}
          onChange={(e) => setData((d: any) => ({ ...d, note: e.target.value }))}
          placeholder="A note about this mood..."
          rows={2}
        />
        {albumId && (
          <div className="border-2 border-dashed border-ink/10 rounded-lg p-4 text-center" {...onDrop}>
            <p className="text-sm text-muted mb-2">Drop photos here or click to upload</p>
            <Input type="file" accept="image/*" multiple hidden {...onDrop} />
            <Button type="button" variant="secondary" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
              <Image className="w-4 h-4 mr-2" /> Choose photos
            </Button>
          </div>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
        </div>
        </form>
    </PaperCard>
  );
}

import { truncate } from '@/lib/utils';