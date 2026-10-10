import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const PaperCard = forwardRef<HTMLDivElement, PaperCardProps>(
  ({ className, children, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('paper-card', hover && 'paper-card-hover', className)}
      {...props}
    >
      {children}
    </div>
  )
);
PaperCard.displayName = 'PaperCard';

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('input', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('textarea', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn('block text-sm font-medium text-ink-soft mb-1', className)} {...props}>
      {children}
    </label>
  )
);
Label.displayName = 'Label';

export function Modal({ isOpen, onClose, title, children, className }: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={cn('paper-card w-full max-w-lg max-h-[85vh] overflow-auto animate-fade-in-up', className)} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-ink/10">
            <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
            <button className="btn-ghost p-1" onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="paper-card p-8 md:p-12 text-center animate-fade-in-up">
      <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-rose" />
      </div>
      <h3 className="font-display text-xl font-medium text-ink mb-2">{title}</h3>
      <p className="text-muted mb-6 max-w-md mx-auto">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

export function ChapterCard({ icon: Icon, title, count, description, href, search, color = 'rose' }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  description: string;
  href: string;
  search?: any;
  color?: string;
}) {
  const colorClasses = {
    rose: 'bg-rose/10 text-rose',
    amber: 'bg-amber/10 text-amber-600',
    emerald: 'bg-emerald/10 text-emerald-600',
    blue: 'bg-blue/10 text-blue-600',
    pink: 'bg-pink/10 text-pink-600',
    violet: 'bg-violet/10 text-violet-600',
  };
  
  return (
    <Link to={href} search={search} className="chapter-card group">
      <div className={cn('chapter-card-icon', colorClasses[color as keyof typeof colorClasses] || colorClasses.rose)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="chapter-card-content">
        <p className="chapter-card-title">{title}</p>
        <p className="chapter-card-count">{count} {count === 1 ? description.split(' ')[0] : description}</p>
      </div>
      <ChevronRight className="chapter-card-arrow" />
    </Link>
  );
}

export function PolaroidStrip({ photos }: { photos: Array<{ id: string; imageData: string; thumbData: string; caption?: string; createdAt: string }> }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
      {photos.map((photo, index) => (
        <div key={photo.id} className="polaroid w-36 md:w-40 flex-shrink-0" style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)` }}>
          <img src={photo.thumbData || photo.imageData} alt={photo.caption || 'Memory'} loading="lazy" />
          {photo.caption && <div className="polaroid-caption">{photo.caption}</div>}
          <div className="polaroid-date">{new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      ))}
    </div>
  );
}

export function Lightbox({ isOpen, onClose, src, alt, caption, onNext, onPrev }: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  caption?: string;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-w-full max-h-[80vh] object-contain" />
        {caption && <p className="text-center text-paper/80 text-sm mt-3">{caption}</p>}
        {onPrev && (
          <button className="absolute left-4 top-1/2 -translate-y-1/2 btn-ghost p-2 text-paper hover:text-white" onClick={onPrev}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {onNext && (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 btn-ghost p-2 text-paper hover:text-white" onClick={onNext}>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        <button className="absolute top-4 right-4 btn-ghost p-2 text-paper hover:text-white" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

import { Link } from '@tanstack/react-router';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';