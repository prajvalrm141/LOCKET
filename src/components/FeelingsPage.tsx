import { useState } from 'react';
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PenTool, Trash2, Edit2, Image, Calendar, Clock } from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { PaperCard, Button, Modal, Input, Textarea, EmptyState, Lightbox } from '@/components/ui';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';

export function FeelingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { feelings } = useLoaderData();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ body: '', feltAt: new Date().toISOString().slice(0, 16), stampData: '', stampThumb: '' });
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: { body: string; feltAt: string; stampData?: string; stampThumb?: string }) => {
      const res = await fetch('/api/feelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/feelings?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feelings?id=${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feelings'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(editData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const startEdit = (feeling: any) => {
    setEditingId(feeling.id);
    setEditData({
      body: feeling.body,
      feltAt: new Date(feeling.feltAt).toISOString().slice(0, 16),
      stampData: feeling.stampData || '',
      stampThumb: feeling.stampThumb || '',
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const validation = validateImageFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    const imageData = await compressImage(file);
    const thumbData = await createThumbnail(imageData);
    setEditData(d => ({ ...d, stampData: imageData, stampThumb: thumbData }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">Feelings</h1>
        <Button onClick={() => { setEditData({ body: '', feltAt: new Date().toISOString().slice(0, 16), stampData: '', stampThumb: '' }); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New feeling
        </Button>
      </div>

      {feelings.length === 0 && !showCreate && (
        <EmptyState
          icon={PenTool}
          title="No feelings yet"
          description="Write dated letters with optional photo stamps. Each one is a moment you felt something."
          action={<Button onClick={() => { setEditData({ body: '', feltAt: new Date().toISOString().slice(0, 16), stampData: '', stampThumb: '' }); setShowCreate(true); }}>Write feeling</Button>}
        />
      )}

      <div className="space-y-4">
        {feelings.map((feeling: any) => (
          <FeelingCard
            key={feeling.id}
            feeling={feeling}
            onEdit={startEdit}
            onDelete={() => deleteMutation.mutate(feeling.id)}
            onClick={() => navigate({ to: `/feelings/${feeling.id}` })}
            onOpenStamp={() => setLightboxPhoto(feeling.stampData!)}
          />
        ))}
        {showCreate && (
          <FeelingForm
            data={editData}
            setData={setEditData}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={createMutation.isPending}
            isDragActive={isDragActive}
            onDrop={getRootProps}
          />
        )}
        {editingId && (
          <FeelingForm
            data={editData}
            setData={setEditData}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
            isPending={updateMutation.isPending}
            isDragActive={isDragActive}
            onDrop={getRootProps}
          />
        )}
      </div>

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Stamp" />
    </div>
  );
}

function FeelingCard({ feeling, onEdit, onDelete, onClick, onOpenStamp }: any) {
  return (
    <PaperCard hover className="group" onClick={onClick}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose/10 flex items-center justify-center">
            <PenTool className="w-6 h-6 text-rose" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-ink-soft leading-relaxed whitespace-pre-wrap">{feeling.body}</p>
            {feeling.stampData && (
              <button 
                className="mt-3 inline-block" 
                onClick={(e) => { e.stopPropagation(); onOpenStamp(); }}
              >
                <img src={feeling.stampThumb || feeling.stampData} alt="Stamp" className="w-20 h-20 object-cover rounded-lg shadow-paper" />
              </button>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(feeling.feltAt)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(feeling.feltAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 border-t border-ink/10 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onEdit(feeling); }}><Edit2 className="w-4 h-4" /></button>
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-4 h-4 text-rose" /></button>
      </div>
    </PaperCard>
  );
}

function FeelingForm({ data, setData, onSubmit, onCancel, isPending, isDragActive, onDrop }: { data: any; setData: (d: any) => void; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isPending: boolean; isDragActive: boolean; onDrop: any }) {
  return (
    <PaperCard className={cn('p-5', isDragActive && 'border-rose border-2')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea
          value={data.body}
          onChange={(e) => setData((d: any) => ({ ...d, body: e.target.value }))}
          placeholder="What did you feel? Write it down..."
          rows={4}
          required
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            type="datetime-local"
            value={data.feltAt}
            onChange={(e) => setData((d: any) => ({ ...d, feltAt: e.target.value }))}
            required
          />
          <div className="border-2 border-dashed border-ink/10 rounded-lg p-4 text-center" {...onDrop}>
            <p className="text-sm text-muted mb-2">Drop a photo stamp or click to upload</p>
            <Input type="file" accept="image/*" hidden {...onDrop} />
            <Button type="button" variant="secondary" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
              <Image className="w-4 h-4 mr-2" /> Add stamp
            </Button>
            {data.stampThumb && (
              <div className="mt-2">
                <img src={data.stampThumb} alt="Stamp preview" className="w-20 h-20 mx-auto object-cover rounded-lg shadow-paper" />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </PaperCard>
  );
}