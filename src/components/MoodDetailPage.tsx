import { useParams, useLoaderData } from '@/hooks/useLoaderData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Smile, Trash2, Edit2, GripVertical, ChevronLeft, Download, Heart, Image as ImageIcon } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PaperCard, Button, PolaroidStrip, Lightbox, Modal, Input } from '@/components/ui';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';

export function MoodDetailPage() {
  const { moodId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mood } = useLoaderData<any>() as any;
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/photos?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', moodId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', moodId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumType: 'mood', albumId: moodId, ids }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos', moodId] }),
  });

  const onDrop = async (acceptedFiles: File[]) => {
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
      body: JSON.stringify({ albumType: 'mood', albumId: moodId, files }),
    });
    const result = await res.json();
    if (result.success) queryClient.invalidateQueries({ queryKey: ['photos', moodId] });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 10 });

  if (!mood) return <div className="max-w-3xl mx-auto p-8 text-center">Mood not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <Link to="/moods" search={{ token: undefined }} className="inline-flex items-center gap-2 text-sm text-rose hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to moods
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">{mood.title}</h1>
          {mood.note && <p className="text-muted mt-1">{mood.note}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { /* @ts-ignore */ navigate({ to: `/moods/${moodId}`, search: { edit: 'true' } }) }}>
            <Edit2 className="w-4 h-4 mr-1" /> Edit mood
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" {...getRootProps()}>
        {getInputProps()}
        {mood.photos.map((photo: any) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onEdit={() => { setEditingPhotoId(photo.id); setEditCaption(photo.caption || ''); }}
            onDelete={() => setShowDeleteConfirm(photo.id)}
            onSetCover={() => updateMutation.mutate({ id: photo.id, data: { isCover: true } })}
            onOpenLightbox={() => setLightboxPhoto(photo.imageData)}
            isCover={photo.isCover}
          />
        ))}
        <PhotoUploadDropzone isDragActive={isDragActive} getRootProps={getRootProps} getInputProps={getInputProps} />
      </div>

      <Modal isOpen={!!editingPhotoId} onClose={() => setEditingPhotoId(null)} title="Edit photo">
        <div className="space-y-3">
          <Input
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Caption (optional)"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditingPhotoId(null)}>Cancel</Button>
            <Button onClick={() => { updateMutation.mutate({ id: editingPhotoId!, data: { caption: editCaption } }); setEditingPhotoId(null); }}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete photo">
        <p className="text-ink-soft">Are you sure you want to delete this photo? This cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { deleteMutation.mutate(showDeleteConfirm!); setShowDeleteConfirm(null); }}>
            Delete
          </Button>
        </div>
      </Modal>

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Photo" />
    </div>
  );
}

function PhotoCard({ photo, onEdit, onDelete, onSetCover, onOpenLightbox, isCover }: any) {
  return (
    <PaperCard hover className="group relative">
      <div className="relative aspect-square overflow-hidden">
        <img src={photo.imageData} alt={photo.caption || 'Photo'} className="w-full h-full object-cover" loading="lazy" />
        {isCover && <div className="absolute top-2 right-2 bg-rose/90 text-white text-xs px-2 py-0.5 rounded">Cover</div>}
      </div>
      {photo.caption && <div className="p-3 text-center text-sm text-ink-soft">{photo.caption}</div>}
      <div className="p-3 border-t border-ink/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button className="btn-ghost p-1" onClick={onEdit}><Edit2 className="w-4 h-4" /></button>
          {!isCover && <button className="btn-ghost p-1" onClick={onSetCover}><Heart className="w-4 h-4" /></button>}
        </div>
        <button className="btn-ghost p-1" onClick={onDelete}><Trash2 className="w-4 h-4 text-rose" /></button>
      </div>
      <button className="absolute inset-0" onClick={onOpenLightbox} aria-label="View full size" />
    </PaperCard>
  );
}

function PhotoUploadDropzone({ isDragActive, getRootProps, getInputProps }: any) {
  return (
    <PaperCard className={cn('flex flex-col items-center justify-center aspect-square p-4 text-center', isDragActive && 'border-rose border-2 bg-rose/5')}>
      <ImageIcon className="w-8 h-8 text-muted mb-2" />
      <p className="text-sm text-muted">{isDragActive ? 'Drop photos here' : 'Click to add photos'}</p>
      <Input type="file" accept="image/*" multiple hidden {...getInputProps()} />
    </PaperCard>
  );
}