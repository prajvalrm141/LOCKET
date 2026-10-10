import type { Space, Occasion, Mood, Photo, Feeling, Quote, Anniversary, AnniversaryMoment, KeepEvent, Wallpaper, User } from '@prisma/client';

export type { Space, Occasion, Mood, Photo, Feeling, Quote, Anniversary, AnniversaryMoment, KeepEvent, Wallpaper, User };

export type PageKey = 
  | 'home'
  | 'occasions'
  | 'moods'
  | 'feelings'
  | 'timeline'
  | 'anniversary'
  | 'quotes'
  | `occasion-${string}`
  | `mood-${string}`;

export interface SpaceWithRelations extends Space {
  wallpapers: Wallpaper[];
  occasions: Occasion[];
  moods: Mood[];
  feelings: Feeling[];
  quotes: Quote[];
  anniversary: Anniversary | null;
  anniversaryMoments: AnniversaryMoment[];
  keepEvents: KeepEvent[];
}

export interface AlbumWithPhotos {
  id: string;
  title: string;
  note: string | null;
  date: Date | null;
  coverPhoto: string | null;
  photos: Photo[];
  createdAt: Date;
  updatedAt: Date;
  type: 'occasion' | 'mood';
}

export interface TimelineDay {
  date: Date;
  events: KeepEvent[];
  glances: Photo[];
}

export interface ShareData {
  space: Space;
  wallpapers: Wallpaper[];
  occasions: (Occasion & { photos: Photo[] })[];
  moods: (Mood & { photos: Photo[] })[];
  feelings: Feeling[];
  quotes: Quote[];
  anniversary: (Anniversary & { moments: AnniversaryMoment[] }) | null;
  keepEvents: KeepEvent[];
}

export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type EventKind = 
  | 'occasion_opened'
  | 'mood_named'
  | 'photo_kept'
  | 'letter_written'
  | 'quote_kept'
  | 'anniversary_tended'
  | 'moment_added'
  | 'wallpaper_set'
  | 'opening_words_tended';

export interface CreateEventInput {
  kind: EventKind;
  refId?: string;
  title: string;
  bodyExcerpt?: string;
  thumbData?: string;
  href: string;
}