import { useParams, useLoaderData } from '@/hooks/useLoaderData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { PenTool, Trash2, Edit2, ChevronLeft, Calendar, Clock, Image, Download } from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { PaperCard, Button, Textarea, Input, Lightbox, Modal } from '@/components/ui';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';

export function FeelingDetailPage() {
  const { feelingId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { feeling } = useLoaderData<any>() as any;
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ body: '', feltAt: '', stampData: '', stampThumb: '' });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/feelings?id=${feelingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/feelings?id=${feelingId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      navigate({ to: '/feelings', search: { token: undefined } });
    },
  });

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

  if (!feeling) return <div className="max-w-3xl mx-auto p-8 text-center">Feeling not found</div>;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editData);
  };

  const startEdit = () => {
    setEditData({
      body: feeling.body,
      feltAt: new Date(feeling.feltAt).toISOString().slice(0, 16),
      stampData: feeling.stampData || '',
      stampThumb: feeling.stampThumb || '',
    });
    setEditing(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Link to="/feelings" search={{ token: undefined }} className="inline-flex items-center gap-2 text-sm text-rose hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to feelings
      </Link>

      {editing ? (
        <FeelingForm
          data={editData}
          setData={setEditData}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isPending={updateMutation.isPending}
          isDragActive={isDragActive}
          onDrop={getRootProps}
        />
      ) : (
        <PaperCard className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-rose/10 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-rose" />
            </div>
            <div className="flex-1">
              <p className="font-sans text-ink-soft leading-relaxed whitespace-pre-wrap">{feeling.body}</p>
              {feeling.stampData && (
                <button className="mt-3 inline-block" onClick={() => setLightboxPhoto(feeling.stampData)}>
                  <img src={feeling.stampThumb || feeling.stampData} alt="Stamp" className="w-24 h-24 object-cover rounded-lg shadow-paper" />
                </button>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(feeling.feltAt)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(feeling.feltAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink/10">
            <Button variant="ghost" onClick={startEdit}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
          </div>
        </PaperCard>
      )}

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete feeling">
        <p className="text-ink-soft">Are you sure you want to delete this feeling? This cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }}>
            Delete
          </Button>
        </div>
      </Modal>

      <Lightbox isOpen={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} src={lightboxPhoto!} alt="Stamp" />
    </div>
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