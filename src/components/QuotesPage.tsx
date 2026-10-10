import { useState } from 'react';
import { useLoaderData } from '@/hooks/useLoaderData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Quote as QuoteIcon, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { PaperCard, Button, Modal, Input, Textarea, EmptyState } from '@/components/ui';

export function QuotesPage() {
  const queryClient = useQueryClient();
  const { quotes, space } = useLoaderData();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ body: '', context: '', saidOn: '' });

  const createMutation = useMutation({
    mutationFn: async (data: { body: string; context?: string; saidOn?: string }) => {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/quotes?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/quotes/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ body: editData.body, context: editData.context, saidOn: editData.saidOn || undefined });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: { body: editData.body, context: editData.context, saidOn: editData.saidOn || undefined } });
  };

  const startEdit = (quote: any) => {
    setEditingId(quote.id);
    setEditData({ body: quote.body, context: quote.context || '', saidOn: quote.saidOn ? new Date(quote.saidOn).toISOString().split('T')[0] : '' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">
          {space?.herName ? `What ${space.herName} said` : 'Her words'}
        </h1>
        <Button onClick={() => { setEditData({ body: '', context: '', saidOn: '' }); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add quote
        </Button>
      </div>

      {quotes.length === 0 && !showCreate && (
        <EmptyState
          icon={QuoteIcon}
          title="No quotes yet"
          description="Save the things she said â€” over tea, on walks, in passing. They become treasures."
          action={<Button onClick={() => { setEditData({ body: '', context: '', saidOn: '' }); setShowCreate(true); }}>Add first quote</Button>}
        />
      )}

      <div className="space-y-4">
        {quotes.map((quote: any) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onEdit={startEdit}
            onDelete={() => deleteMutation.mutate(quote.id)}
            herName={space?.herName}
          />
        ))}
        {showCreate && (
          <QuoteForm
            data={editData}
            setData={setEditData}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={createMutation.isPending}
          />
        )}
        {editingId && (
          <QuoteForm
            data={editData}
            setData={setEditData}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
            isPending={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

function QuoteCard({ quote, onEdit, onDelete, herName }: any) {
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
      <div className="px-5 pb-5 border-t border-ink/10 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onEdit(quote); }}><Edit2 className="w-4 h-4" /></button>
        <button className="btn-ghost p-2" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-4 h-4 text-rose" /></button>
      </div>
    </PaperCard>
  );
}

function QuoteForm({ data, setData, onSubmit, onCancel, isPending }: { data: any; setData: (d: any) => void; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isPending: boolean }) {
  return (
    <PaperCard className="p-5">
      <form onSubmit={onSubmit} className="space-y-4">
<Textarea
          value={data.body}
          onChange={(e) => setData((d: any) => ({ ...d, body: e.target.value }))}
          placeholder="What did she say?"
          rows={3}
          required
        />
        <Input
          value={data.context}
          onChange={(e) => setData((d: any) => ({ ...d, context: e.target.value }))}
          placeholder='Context (e.g., "over tea on a rainy afternoon")'
        />
        <Input
          type="date"
          value={data.saidOn}
          onChange={(e) => setData((d: any) => ({ ...d, saidOn: e.target.value }))}
        />
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </PaperCard>
  );
}
