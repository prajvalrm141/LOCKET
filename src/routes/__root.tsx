import { createRootRoute, createRoute, createRouter, Link, Outlet, useLoaderData, useParams, useNavigate, useLocation } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState, useRef } from 'react';
import { cn, formatDate, truncate, yearsTogether, daysTogether, timeAgo } from '@/lib/utils';
import '@/styles/globals.css';
import { PaperCard, Button, Input, Textarea, Modal, EmptyState, PolaroidStrip, Lightbox, ChapterCard } from '@/components/ui';
import { HomePage } from '@/components/HomePage';
import { OccasionsPage } from '@/components/OccasionsPage';
import { OccasionDetailPage } from '@/components/OccasionDetailPage';
import { MoodsPage } from '@/components/MoodsPage';
import { MoodDetailPage } from '@/components/MoodDetailPage';
import { FeelingsPage } from '@/components/FeelingsPage';
import { FeelingDetailPage } from '@/components/FeelingDetailPage';
import { TimelinePage } from '@/components/TimelinePage';
import { AnniversaryPage } from '@/components/AnniversaryPage';
import { QuotesPage } from '@/components/QuotesPage';
import { ReadHomePage, ReadOccasionsPage, ReadMoodsPage, ReadFeelingsPage, ReadTimelinePage, ReadAnniversaryPage, ReadQuotesPage } from '@/components/ReadPages';
import { ReadOccasionDetailPage, ReadMoodDetailPage, ReadFeelingDetailPage } from '@/components/ReadDetailPages';
import { Heart, Smile, PenTool, Calendar, BookOpen, Quote, Plus, Settings, Copy, RotateCw, Pause, Play, ExternalLink, Trash2, Edit2, MoreHorizontal, Menu, X, ChevronRight, ChevronLeft, Eye, Share2, Download, GripVertical, Clock } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { compressImage, createThumbnail, validateImageFile } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { useMutation } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export interface SpaceData {
  space: {
    id: string;
    title: string;
    dedication: string;
    herName: string;
    ownerName: string;
    shareToken: string;
    shareEnabled: boolean;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  isReadOnly: boolean;
  occasions?: any[];
  moods?: any[];
  feelings?: any[];
  quotes?: any[];
  anniversary?: any;
  anniversaryMoments?: any[];
  keepEvents?: any[];
  wallpapers?: any[];
  occasion?: any;
  mood?: any;
  feeling?: any;
}

async function getSpaceData(token?: string) {
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  
  const res = await fetch(`/api/space?${params.toString()}`);
  if (!res.ok) return { space: null, user: null, isReadOnly: !!token, occasions: [], moods: [], feelings: [], quotes: [], anniversary: null, anniversaryMoments: [], keepEvents: [], wallpapers: [] };
  return res.json() as Promise<SpaceData>;
}

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  ),
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  validateSearch: (search) => ({}),
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  validateSearch: (search) => ({}),
  component: LoginPage,
});

const writeRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: async () => getSpaceData(),
  component: WriteLayout,
  validateSearch: (search) => ({ token: search.token as string | undefined }),
  beforeLoad: async ({ search, location }) => {
    if (location.pathname.startsWith('/for-you')) return;
    if (!search.token) {
      const res = await fetch('/api/auth/session');
      if (!res.ok) throw loginRoute.to;
    }
  },
});

const homeRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: '/',
  validateSearch: (search) => ({}),
  component: () => <HomePage space={useLoaderData()['space']} />,
});

const occasionsRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'occasions',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: OccasionsPage,
});

const occasionDetailRoute = createRoute({
  getParentRoute: () => occasionsRoute,
  path: '/$occasionId',
  validateSearch: (search) => ({ edit: search.edit as string | undefined }),
  loader: async ({ params }) => {
    const { space, ...data } = await getSpaceData();
    const res = await fetch(`/api/occasions?id=${params.occasionId}`);
    const occasion = await res.json();
    return { space, occasion, ...data };
  },
  component: OccasionDetailPage,
});

const moodsRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'moods',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: MoodsPage,
});

const moodDetailRoute = createRoute({
  getParentRoute: () => moodsRoute,
  path: '/$moodId',
  validateSearch: (search) => ({ edit: search.edit as string | undefined }),
  loader: async ({ params }) => {
    const { space, ...data } = await getSpaceData();
    const res = await fetch(`/api/moods?id=${params.moodId}`);
    const mood = await res.json();
    return { space, mood, ...data };
  },
  component: MoodDetailPage,
});

const feelingsRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'feelings',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: FeelingsPage,
});

const feelingDetailRoute = createRoute({
  getParentRoute: () => feelingsRoute,
  path: '/$feelingId',
  validateSearch: (search) => ({}),
  loader: async ({ params }) => {
    const { space, ...data } = await getSpaceData();
    const res = await fetch(`/api/feelings?id=${params.feelingId}`);
    const feeling = await res.json();
    return { space, feeling, ...data };
  },
  component: FeelingDetailPage,
});

const timelineRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'timeline',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: TimelinePage,
});

const anniversaryRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'anniversary',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: AnniversaryPage,
});

const quotesRoute = createRoute({
  getParentRoute: () => writeRootRoute,
  path: 'quotes',
  validateSearch: (search) => ({}),
  loader: async () => {
    const { space, ...data } = await getSpaceData();
    return { space, ...data };
  },
  component: QuotesPage,
});

const readRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/for-you/$token',
  validateSearch: (search) => ({}),
  loader: async ({ params }) => getSpaceData(params.token),
  component: ReadLayout,
});

const readHomeRoute = createRoute({
  getParentRoute: () => readRoute,
  path: '/',
  validateSearch: (search) => ({}),
  component: ReadHomePage,
});

const readOccasionsRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'occasions',
  validateSearch: (search) => ({}),
  component: ReadOccasionsPage,
});

const readOccasionDetailRoute = createRoute({
  getParentRoute: () => readOccasionsRoute,
  path: '/$occasionId',
  validateSearch: (search) => ({}),
  loader: async ({ params }) => {
    const data = await getSpaceData(params.token);
    const res = await fetch(`/api/occasions?id=${params.occasionId}`);
    const occasion = await res.json();
    return { ...data, occasion };
  },
  component: ReadOccasionDetailPage,
});

const readMoodsRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'moods',
  validateSearch: (search) => ({}),
  component: ReadMoodsPage,
});

const readMoodDetailRoute = createRoute({
  getParentRoute: () => readMoodsRoute,
  path: '/$moodId',
  validateSearch: (search) => ({}),
  loader: async ({ params }) => {
    const data = await getSpaceData(params.token);
    const res = await fetch(`/api/moods?id=${params.moodId}`);
    const mood = await res.json();
    return { ...data, mood };
  },
  component: ReadMoodDetailPage,
});

const readFeelingsRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'feelings',
  validateSearch: (search) => ({}),
  component: ReadFeelingsPage,
});

const readFeelingDetailRoute = createRoute({
  getParentRoute: () => readFeelingsRoute,
  path: '/$feelingId',
  validateSearch: (search) => ({}),
  loader: async ({ params }) => {
    const data = await getSpaceData(params.token);
    const res = await fetch(`/api/feelings?id=${params.feelingId}`);
    const feeling = await res.json();
    return { ...data, feeling };
  },
  component: ReadFeelingDetailPage,
});

const readTimelineRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'timeline',
  validateSearch: (search) => ({}),
  component: ReadTimelinePage,
});

const readAnniversaryRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'anniversary',
  validateSearch: (search) => ({}),
  component: ReadAnniversaryPage,
});

const readQuotesRoute = createRoute({
  getParentRoute: () => readRoute,
  path: 'quotes',
  validateSearch: (search) => ({}),
  component: ReadQuotesPage,
});

const routeTree = createRouter({
  routeTree: rootRoute.addChildren([
    authRoute.addChildren([loginRoute]),
    writeRootRoute.addChildren([
      homeRoute,
      occasionsRoute.addChildren([occasionDetailRoute]),
      moodsRoute.addChildren([moodDetailRoute]),
      feelingsRoute.addChildren([feelingDetailRoute]),
      timelineRoute,
      anniversaryRoute,
      quotesRoute,
    ]),
    readRoute.addChildren([
      readHomeRoute,
      readOccasionsRoute.addChildren([readOccasionDetailRoute]),
      readMoodsRoute.addChildren([readMoodDetailRoute]),
      readFeelingsRoute.addChildren([readFeelingDetailRoute]),
      readTimelineRoute,
      readAnniversaryRoute,
      readQuotesRoute,
    ]),
  ]),
});

export type Router = typeof routeTree;

export { readOccasionDetailRoute, readMoodDetailRoute, readFeelingDetailRoute };

declare module '@tanstack/react-router' {
  interface Register {
    router: Router;
  }
}

export const router = routeTree;

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <PaperCard className="w-full max-w-md p-8">
        <h1 className="font-display text-3xl font-medium text-center text-ink mb-2">Welcome to Locket</h1>
        <p className="text-center text-muted mb-8">A private keep for memories</p>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={() => window.location.href = '/api/auth/signin/google'}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
            Continue with Google
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => window.location.href = '/api/auth/signin/github'}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            Continue with GitHub
          </Button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-ink/10" /></div>
            <span className="relative bg-white/90 px-4 text-sm text-muted">Or continue with email</span>
          </div>
          <EmailSignInForm />
        </div>
      </PaperCard>
    </div>
  );
}

function EmailSignInForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value;
    if (!email) return;
    await fetch('/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    alert('Magic link sent! Check your email.');
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-soft mb-1">Email</label>
        <Input ref={emailRef} type="email" required placeholder="you@example.com" />
      </div>
      <Button type="submit" className="w-full">Send magic link</Button>
    </form>
  );
}

function WriteLayout() {
  const { space, user, isReadOnly } = useLoaderData();
  const [showDedication, setShowDedication] = useState(false);
  
  useEffect(() => {
    if (space && !isReadOnly && !localStorage.getItem('dedicationSeen')) {
      setShowDedication(true);
    }
  }, [space, isReadOnly]);

  return (
    <div className="relative min-h-screen">
      <PageBackground pageKey="home" />
      <div className="relative z-20 min-h-screen flex flex-col">
        <Header user={user} space={space} isReadOnly={false} />
        <main className="flex-1 p-4 md:p-6 lg:p-8"><Outlet /></main>
        <Footer space={space} />
      </div>
      {showDedication && space && (
        <DedicationOverlay 
          space={space} 
          onDismiss={() => {
            localStorage.setItem('dedicationSeen', 'true');
            setShowDedication(false);
          }} 
        />
      )}
      <HoldToPeek />
    </div>
  );
}

function ReadLayout() {
  const { space, isReadOnly } = useLoaderData();
  const [showDedication, setShowDedication] = useState(true);
  const hasSeen = space ? localStorage.getItem(`dedicationSeen_${space?.shareToken}`) : true;

  useEffect(() => {
    if (hasSeen) setShowDedication(false);
  }, [hasSeen]);

  return (
    <div className="relative min-h-screen">
      <PageBackground pageKey="home" />
      <div className="relative z-20 min-h-screen flex flex-col">
        <Header user={null} space={space} isReadOnly={true} />
        <main className="flex-1 p-4 md:p-6 lg:p-8"><Outlet /></main>
        <Footer space={space} isReadOnly />
      </div>
      {showDedication && space && (
        <DedicationOverlay 
          space={space} 
          onDismiss={() => {
            localStorage.setItem(`dedicationSeen_${space?.shareToken}`, 'true');
            setShowDedication(false);
          }} 
        />
      )}
      <HoldToPeek />
    </div>
  );
}

function Header({ user, space, isReadOnly }: { user: SpaceData['user']; space: SpaceData['space']; isReadOnly: boolean }) {
  const { user: authUser } = useAuth();
  const displayUser = user || authUser;
  
  return (
    <header className="sticky top-0 z-30 bg-paper/80 backdrop-blur-md border-b border-ink/5 px-4 md:px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" search={{ token: undefined }} className="font-display text-xl font-medium text-ink">
            {space?.title || 'Locket'}
          </Link>
          {isReadOnly && <span className="read-only-badge">Read only</span>}
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/">Keep</NavLink>
          <NavLink to="/occasions">Occasions</NavLink>
          <NavLink to="/moods">Moods</NavLink>
          <NavLink to="/feelings">Feelings</NavLink>
          <NavDropdown />
        </nav>
        <MobileNav space={space} user={displayUser as SpaceData['user']} />
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link to={to} search={{ token: undefined }} className={cn('nav-link', active && 'nav-link-active')}>
      {children}
    </Link>
  );
}

function NavDropdown() {
  return (
    <div className="relative group">
      <Button variant="ghost" className="p-2"><MoreHorizontal className="w-5 h-5" /></Button>
      <div className="absolute right-0 top-full mt-2 w-48 paper-card rounded-xl shadow-paper-hover py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <Link to="/timeline" search={{ token: undefined }} className="block px-4 py-2 text-sm text-ink hover:bg-ink/5">Timeline</Link>
        <Link to="/anniversary" search={{ token: undefined }} className="block px-4 py-2 text-sm text-ink hover:bg-ink/5">Anniversary</Link>
        <Link to="/quotes" search={{ token: undefined }} className="block px-4 py-2 text-sm text-ink hover:bg-ink/5">Her words</Link>
      </div>
    </div>
  );
}

function MobileNav({ space, user }: { space: SpaceData['space']; user: SpaceData['user'] }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="md:hidden">
      <Button variant="ghost" className="p-2" onClick={() => setOpen(!open)}>
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
{open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up">
          <PaperCard className="rounded-t-2xl p-4 space-y-3 max-h-[70vh] overflow-auto">
            <Link to="/" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Keep</Link>
            <Link to="/occasions" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Occasions</Link>
            <Link to="/moods" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Moods</Link>
            <Link to="/feelings" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Feelings</Link>
            <hr className="border-ink/10 my-2" />
            <Link to="/timeline" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Timeline</Link>
            <Link to="/anniversary" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Anniversary</Link>
            <Link to="/quotes" search={{ token: undefined }} className="nav-link" onClick={() => setOpen(false)}>Her words</Link>
            {user && space && !space?.shareEnabled && (
              <SharePanel space={space} />
            )}
          </PaperCard>
        </div>
      )}
    </div>
  );
}

function Footer({ space, isReadOnly = false }: { space: SpaceData['space']; isReadOnly?: boolean }) {
  if (!space) return null;
  
  return (
    <footer className="border-t border-ink/5 px-4 md:px-6 py-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted text-center md:text-left">
          {isReadOnly 
            ? `A keep left for ${space?.herName} by ${space?.ownerName}`
            : `Your keep Â· {space?.shareEnabled ? 'Sharing enabled' : 'Private'}`
          }
        </p>
{!isReadOnly && space?.shareEnabled && space?.shareToken && (
          <Link 
            to="/for-you/$token"
            params={{ token: space.shareToken }}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-1" /> View as her
          </Link>
        )}
      </div>
    </footer>
  );
}

function DedicationOverlay({ space, onDismiss }: { space: SpaceData['space']; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4" onClick={onDismiss}>
      <PaperCard className="w-full max-w-md p-8 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-rose" />
        </div>
        <h2 className="font-display text-2xl font-medium text-ink mb-2">{space?.dedication}</h2>
        <p className="text-muted mb-6">From {space?.ownerName} to {space?.herName}</p>
        <Button onClick={onDismiss} className="w-full">Enter the keep</Button>
      </PaperCard>
    </div>
  );
}

function HoldToPeek() {
  const [active, setActive] = useState(false);
  
  const handlePointerDown = () => setActive(true);
  const handlePointerUp = () => setActive(false);
  const handlePointerLeave = () => setActive(false);

  return (
    <Button
      variant="ghost"
      className={cn(
        'fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-paper-hover border border-ink/10',
        'peek-preserve transition-transform duration-200',
        active && 'scale-95'
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      aria-label="Hold to peek at background"
    >
      <Eye className={cn('w-5 h-5 text-ink-soft transition-colors', active && 'text-rose')} />
    </Button>
  );
}

function PageBackground({ pageKey }: { pageKey: string }) {
  return (
    <>
      <div className="page-bg fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/wallpapers/${pageKey}.jpg')` }} />
      <div className="page-overlay fixed inset-0 z-10 bg-ink/0 transition-opacity duration-slow" style={{ opacity: 0.3 }} />
    </>
  );
}

function SharePanel({ space }: { space: SpaceData['space'] }) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const shareUrl = `${window.location.origin}/for-you/${space?.shareToken}`;
  const { mutate: toggleShare } = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/space/mutations?action=toggle-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return res.json();
    },
  });
  const { mutate: rotateToken } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/space/mutations?action=rotate-token', { method: 'POST' });
      return res.json();
    },
  });

  if (!showPanel) return (
    <Button variant="secondary" className="w-full md:w-auto" onClick={() => setShowPanel(true)}>
      <Share2 className="w-4 h-4 mr-2" /> Share keep
    </Button>
  );

  return (
    <PaperCard className="p-4 border-rose/20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-ink">Share your keep</h3>
        <Button variant="ghost" className="p-1" onClick={() => setShowPanel(false)}><X className="w-5 h-5" /></Button>
      </div>
      <p className="text-sm text-muted mb-4">Copy this link to share with {space?.herName}. Only this URL works for her.</p>
      <div className="flex gap-2 mb-3">
        <Input value={shareUrl} readOnly className="flex-1 text-xs" />
        <Button 
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <p className="text-xs text-rose/80 bg-rose/5 p-2 rounded mb-4">âš  Private preview links don't work for her. Only /for-you/... URLs are shareable.</p>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={space?.shareEnabled ? 'primary' : 'secondary'} 
          onClick={() => toggleShare(!space?.shareEnabled)}
        >
          {space?.shareEnabled ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {space?.shareEnabled ? 'Pause sharing' : 'Enable sharing'}
        </Button>
        <Button variant="ghost" onClick={() => rotateToken()}><RotateCw className="w-4 h-4 mr-1" /> Rotate token</Button>
        <Button variant="ghost" onClick={() => window.open(shareUrl, '_blank')}><ExternalLink className="w-4 h-4 mr-1" /> Preview</Button>
      </div>
    </PaperCard>
  );
}
