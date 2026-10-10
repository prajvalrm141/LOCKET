import express from 'express';
import { createServer } from 'vite';
import { auth } from './src/lib/auth';
import { getPrisma } from './src/lib/db';
import path from "path";
import { fileURLToPath } from "url";

let prismaAvailable = false;

async function initializePrisma() {
  try {
    getPrisma();
    prismaAvailable = true;
    console.log('Database initialized');
  } catch (e) {
    console.warn('Database not available:', e instanceof Error ? e.message : 'Unknown error');
    prismaAvailable = false;
  }
}

function getDb() {
  if (!prismaAvailable) {
    throw new Error('Database not connected');
  }
  return getPrisma();
}

async function startServer() {
  initializePrisma();
  
  const app = express();
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(vite.middlewares);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, db: prismaAvailable });
  });

  // Auth routes (work without DB for magic links in dev)
  app.all('/api/auth/*', async (req, res) => {
    try {
      const response = await auth.handler(req);
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
      res.status(response.status);
      const body = await response.text();
      res.send(body);
    } catch (e) {
      res.status(500).json({ error: 'Auth error' });
    }
  });

  // Mock or real API routes
  const withDb = prismaAvailable ? getDb : null;

  // Space routes
  app.get('/api/space', async (req, res) => {
    try {
      const token = req.query.token as string | undefined;
      
      if (token && withDb) {
        const prisma = withDb();
        const space = await prisma.space.findUnique({
          where: { shareToken: token, shareEnabled: true },
          include: {
            wallpapers: true,
            occasions: { include: { photos: true }, orderBy: { createdAt: 'desc' } },
            moods: { include: { photos: true }, orderBy: { createdAt: 'desc' } },
            feelings: { orderBy: { feltAt: 'desc' } },
            quotes: { orderBy: { createdAt: 'desc' } },
            anniversary: { include: { moments: { orderBy: { sortOrder: 'asc' } } } },
            keepEvents: { orderBy: { happenedAt: 'desc' } },
          },
        });
        
        if (!space) {
          return res.json({ space: null, user: null, isReadOnly: true, occasions: [], moods: [], feelings: [], quotes: [], anniversary: null, anniversaryMoments: [], keepEvents: [], wallpapers: [] });
        }
        
        return res.json({
          space: {
            id: space.id,
            title: space.title,
            dedication: space.dedication,
            herName: space.herName,
            ownerName: space.ownerName,
            shareToken: space.shareToken,
            shareEnabled: space.shareEnabled,
          },
          user: null,
          isReadOnly: true,
          occasions: space.occasions,
          moods: space.moods,
          feelings: space.feelings,
          quotes: space.quotes,
          anniversary: space.anniversary,
          anniversaryMoments: space.anniversaryMoments || [],
          keepEvents: space.keepEvents,
          wallpapers: space.wallpapers,
        });
      }
      
      if (withDb) {
        const prisma = withDb();
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
          return res.json({ space: null, user: null, isReadOnly: false, occasions: [], moods: [], feelings: [], quotes: [], anniversary: null, anniversaryMoments: [], keepEvents: [], wallpapers: [] });
        }
        
        const space = await prisma.space.findUnique({
          where: { userId: session.user.id },
          include: {
            wallpapers: true,
            occasions: { include: { photos: true }, orderBy: { createdAt: 'desc' } },
            moods: { include: { photos: true }, orderBy: { createdAt: 'desc' } },
            feelings: { orderBy: { feltAt: 'desc' } },
            quotes: { orderBy: { createdAt: 'desc' } },
            anniversary: { include: { moments: { orderBy: { sortOrder: 'asc' } } } },
            keepEvents: { orderBy: { happenedAt: 'desc' } },
          },
        });
        
        res.json({
          space: space ? {
            id: space.id,
            title: space.title,
            dedication: space.dedication,
            herName: space.herName,
            ownerName: space.ownerName,
            shareToken: space.shareToken,
            shareEnabled: space.shareEnabled,
          } : null,
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          },
          isReadOnly: false,
          occasions: space?.occasions || [],
          moods: space?.moods || [],
          feelings: space?.feelings || [],
          quotes: space?.quotes || [],
          anniversary: space?.anniversary || null,
          anniversaryMoments: space?.anniversaryMoments || [],
          keepEvents: space?.keepEvents || [],
          wallpapers: space?.wallpapers || [],
        });
      } else {
        res.json({ space: null, user: null, isReadOnly: !!token, occasions: [], moods: [], feelings: [], quotes: [], anniversary: null, anniversaryMoments: [], keepEvents: [], wallpapers: [] });
      }
    } catch (e) {
      console.error('Space error:', e);
      res.status(500).json({ error: 'Failed to load space' });
    }
  });

  app.patch('/api/space/mutations', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const data = req.body;
      const space = await prisma.space.update({
        where: { userId: session.user.id },
        data: {
          title: data.title,
          dedication: data.dedication,
          herName: data.herName,
          ownerName: data.ownerName,
        },
      });
      
      res.json({ success: true, data: { title: space.title, dedication: space.dedication, herName: space.herName, ownerName: space.ownerName } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update space' });
    }
  });

  app.post('/api/space/mutations', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const action = req.query.action;
      
      if (action === 'toggle-share') {
        const { enabled } = req.body;
        const space = await prisma.space.update({
          where: { userId: session.user.id },
          data: { shareEnabled: enabled },
        });
        const shareUrl = enabled ? `${process.env.APP_URL}/for-you/${space.shareToken}` : undefined;
        return res.json({ success: true, data: { shareEnabled: space.shareEnabled, shareUrl } });
      }
      
      if (action === 'rotate-token') {
        const newToken = crypto.randomUUID();
        const space = await prisma.space.update({
          where: { userId: session.user.id },
          data: { shareToken: newToken },
        });
        const shareUrl = `${process.env.APP_URL}/for-you/${space.shareToken}`;
        return res.json({ success: true, data: { shareToken: space.shareToken, shareUrl } });
      }
      
      res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update space' });
    }
  });

  // Occasion routes
  app.get('/api/occasions', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const id = req.query.id as string | undefined;
      
      if (id) {
        const occasion = await prisma.occasion.findFirst({
          where: { id, userId: session.user.id },
          include: { photos: { orderBy: { sortOrder: 'asc' } } },
        });
        return res.json(occasion);
      }
      
      const occasions = await prisma.occasion.findMany({
        where: { userId: session.user.id },
        include: { photos: { where: { isCover: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json(occasions);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load occasions' });
    }
  });

  app.post('/api/occasions', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { title, note, date } = req.body;
      const occasion = await prisma.occasion.create({
        data: { userId: session.user.id, title, note, date: date ? new Date(date) : null },
      });
      
      await prisma.keepEvent.create({
        data: {
          userId: session.user.id,
          kind: 'occasion_opened',
          refId: occasion.id,
          title: occasion.title,
          bodyExcerpt: occasion.note ?? undefined,
          href: `/occasions/${occasion.id}`,
        },
      });
      
      res.json({ success: true, data: { id: occasion.id } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to create occasion' });
    }
  });

  app.patch('/api/occasions', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const data = req.body;
      
      const occasion = await prisma.occasion.findFirst({ where: { id, userId: session.user.id } });
      if (!occasion) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.occasion.update({
        where: { id },
        data: { title: data.title, note: data.note, date: data.date ? new Date(data.date) : null, coverPhoto: data.coverPhoto },
      });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update occasion' });
    }
  });

  app.delete('/api/occasions', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const occasion = await prisma.occasion.findFirst({ where: { id, userId: session.user.id } });
      if (!occasion) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.$transaction([
        prisma.photo.deleteMany({ where: { albumType: 'occasion', albumId: id } }),
        prisma.occasion.delete({ where: { id } }),
      ]);
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete occasion' });
    }
  });

  app.post('/api/occasions/reorder', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { ids } = req.body;
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.occasion.update({
            where: { id, userId: session.user.id },
            data: { updatedAt: new Date(Date.now() + index) },
          })
        )
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to reorder occasions' });
    }
  });

  // Mood routes
  app.get('/api/moods', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const id = req.query.id as string | undefined;
      
      if (id) {
        const mood = await prisma.mood.findFirst({
          where: { id, userId: session.user.id },
          include: { photos: { orderBy: { sortOrder: 'asc' } } },
        });
        return res.json(mood);
      }
      
      const moods = await prisma.mood.findMany({
        where: { userId: session.user.id },
        include: { photos: { where: { isCover: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json(moods);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load moods' });
    }
  });

  app.post('/api/moods', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { title, note } = req.body;
      const mood = await prisma.mood.create({
        data: { userId: session.user.id, title, note },
      });
      
      await prisma.keepEvent.create({
        data: {
          userId: session.user.id,
          kind: 'mood_named',
          refId: mood.id,
          title: mood.title,
          bodyExcerpt: mood.note ?? undefined,
          href: `/moods/${mood.id}`,
        },
      });
      
      res.json({ success: true, data: { id: mood.id } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to create mood' });
    }
  });

  app.patch('/api/moods', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const data = req.body;
      
      const mood = await prisma.mood.findFirst({ where: { id, userId: session.user.id } });
      if (!mood) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.mood.update({
        where: { id },
        data: { title: data.title, note: data.note, coverPhoto: data.coverPhoto },
      });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update mood' });
    }
  });

  app.delete('/api/moods', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const mood = await prisma.mood.findFirst({ where: { id, userId: session.user.id } });
      if (!mood) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.$transaction([
        prisma.photo.deleteMany({ where: { albumType: 'mood', albumId: id } }),
        prisma.mood.delete({ where: { id } }),
      ]);
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete mood' });
    }
  });

  app.post('/api/moods/reorder', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { ids } = req.body;
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.mood.update({
            where: { id, userId: session.user.id },
            data: { updatedAt: new Date(Date.now() + index) },
          })
        )
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to reorder moods' });
    }
  });

  // Photo routes
  app.get('/api/photos', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const albumType = req.query.albumType as string;
      const albumId = req.query.albumId as string;
      
      if (!albumType || !albumId) return res.status(400).json({ error: 'Missing params' });
      
      const photos = await prisma.photo.findMany({
        where: { userId: session.user.id, albumType, albumId },
        orderBy: { sortOrder: 'asc' },
      });
      
      res.json(photos);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load photos' });
    }
  });

  app.post('/api/photos', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { albumType, albumId, files } = req.body;
      
      const album = albumType === 'occasion'
        ? await prisma.occasion.findFirst({ where: { id: albumId, userId: session.user.id } })
        : await prisma.mood.findFirst({ where: { id: albumId, userId: session.user.id } });
      
      if (!album) return res.status(404).json({ success: false, error: 'Album not found' });
      
      const existingCount = await prisma.photo.count({ where: { albumType, albumId } });
      
      await prisma.$transaction(
        files.map((file: any, index: number) =>
          prisma.photo.create({
            data: {
              userId: session.user.id,
              albumType,
              albumId,
              imageData: file.imageData,
              thumbData: file.thumbData,
              caption: file.caption,
              sortOrder: existingCount + index,
            },
          })
        )
      );
      
      const newPhotos = await prisma.photo.findMany({ where: { albumType, albumId, userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: files.length });
      
      for (const photo of newPhotos) {
        await prisma.keepEvent.create({
          data: {
            userId: session.user.id,
            kind: 'photo_kept',
            refId: photo.id,
            title: album.title,
            bodyExcerpt: photo.caption ?? undefined,
            thumbData: photo.thumbData,
            href: `/${albumType}s/${albumId}`,
          },
        });
      }
      
      res.json({ success: true, data: { count: files.length } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to upload photos' });
    }
  });

  app.patch('/api/photos', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const data = req.body;
      
      const photo = await prisma.photo.findFirst({ where: { id, userId: session.user.id } });
      if (!photo) return res.status(404).json({ success: false, error: 'Not found' });
      
      if (data.isCover) {
        await prisma.photo.updateMany({
          where: { albumType: photo.albumType, albumId: photo.albumId, userId: session.user.id },
          data: { isCover: false },
        });
      }
      
      await prisma.photo.update({
        where: { id },
        data: { caption: data.caption, isCover: data.isCover },
      });
      
      if (data.isCover) {
        const album = photo.albumType === 'occasion'
          ? await prisma.occasion.findUnique({ where: { id: photo.albumId } })
          : await prisma.mood.findUnique({ where: { id: photo.albumId } });
        if (album) {
          await prisma[photo.albumType].update({
            where: { id: photo.albumId },
            data: { coverPhoto: photo.imageData },
          });
        }
      }
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update photo' });
    }
  });

  app.delete('/api/photos', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const photo = await prisma.photo.findFirst({ where: { id, userId: session.user.id } });
      if (!photo) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.photo.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete photo' });
    }
  });

  app.post('/api/photos/reorder', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { albumType, albumId, ids } = req.body;
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.photo.update({
            where: { id, userId: session.user.id, albumType, albumId },
            data: { sortOrder: index },
          })
        )
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to reorder photos' });
    }
  });

  // Feeling routes
  app.get('/api/feelings', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const id = req.query.id as string | undefined;
      
      if (id) {
        const feeling = await prisma.feeling.findFirst({ where: { id, userId: session.user.id } });
        return res.json(feeling);
      }
      
      const feelings = await prisma.feeling.findMany({
        where: { userId: session.user.id },
        orderBy: { feltAt: 'desc' },
      });
      
      res.json(feelings);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load feelings' });
    }
  });

  app.post('/api/feelings', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { body, feltAt, stampData, stampThumb } = req.body;
      const feeling = await prisma.feeling.create({
        data: { userId: session.user.id, body, feltAt: new Date(feltAt), stampData, stampThumb },
      });
      
      await prisma.keepEvent.create({
        data: {
          userId: session.user.id,
          kind: 'letter_written',
          refId: feeling.id,
          title: 'A feeling kept',
          bodyExcerpt: feeling.body.slice(0, 120),
          thumbData: feeling.stampThumb ?? undefined,
          href: `/feelings/${feeling.id}`,
        },
      });
      
      res.json({ success: true, data: { id: feeling.id } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to create feeling' });
    }
  });

  app.patch('/api/feelings', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const data = req.body;
      
      const feeling = await prisma.feeling.findFirst({ where: { id, userId: session.user.id } });
      if (!feeling) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.feeling.update({ where: { id }, data });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update feeling' });
    }
  });

  app.delete('/api/feelings', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const feeling = await prisma.feeling.findFirst({ where: { id, userId: session.user.id } });
      if (!feeling) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.feeling.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete feeling' });
    }
  });

  // Quote routes
  app.get('/api/quotes', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const quotes = await prisma.quote.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json(quotes);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load quotes' });
    }
  });

  app.post('/api/quotes', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { body, context, saidOn } = req.body;
      const quote = await prisma.quote.create({
        data: { userId: session.user.id, body, context, saidOn: saidOn ? new Date(saidOn) : null },
      });
      
      await prisma.keepEvent.create({
        data: {
          userId: session.user.id,
          kind: 'quote_kept',
          refId: quote.id,
          title: 'A quote kept',
          bodyExcerpt: quote.body.slice(0, 120),
          href: '/quotes',
        },
      });
      
      res.json({ success: true, data: { id: quote.id } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to create quote' });
    }
  });

  app.patch('/api/quotes', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const data = req.body;
      
      const quote = await prisma.quote.findFirst({ where: { id, userId: session.user.id } });
      if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.quote.update({ where: { id }, data });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update quote' });
    }
  });

  app.delete('/api/quotes', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const quote = await prisma.quote.findFirst({ where: { id, userId: session.user.id } });
      if (!quote) return res.status(404).json({ success: false, error: 'Not found' });
      
      await prisma.quote.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete quote' });
    }
  });

  app.post('/api/quotes/reorder', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { ids } = req.body;
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.quote.update({
            where: { id, userId: session.user.id },
            data: { updatedAt: new Date(Date.now() + index) },
          })
        )
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to reorder quotes' });
    }
  });

  // Anniversary routes
  app.get('/api/anniversary', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const anniversary = await prisma.anniversary.findUnique({
        where: { userId: session.user.id },
        include: { moments: { orderBy: { sortOrder: 'asc' } } },
      });
      
      res.json(anniversary);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load anniversary' });
    }
  });

  app.post('/api/anniversary', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const action = req.query.action;
      
      if (action === 'moment') {
        const { title, body, year, date, photoData, photoThumb } = req.body;
        const anniversary = await prisma.anniversary.findUnique({ where: { userId: session.user.id } });
        if (!anniversary) return res.status(404).json({ success: false, error: 'Anniversary not set up' });
        
        const count = await prisma.anniversaryMoment.count({ where: { anniversaryId: anniversary.id } });
        
        const moment = await prisma.anniversaryMoment.create({
          data: {
            userId: session.user.id,
            anniversaryId: anniversary.id,
            title,
            body,
            year,
            date: date ? new Date(date) : null,
            photoData,
            photoThumb,
            sortOrder: count,
          },
        });
        
        await prisma.keepEvent.create({
          data: {
            userId: session.user.id,
            kind: 'moment_added',
            refId: moment.id,
            title: moment.title,
            bodyExcerpt: moment.body.slice(0, 120),
            thumbData: moment.photoThumb ?? undefined,
            href: '/anniversary',
          },
        });
        
        return res.json({ success: true, data: { id: moment.id } });
      }
      
      const { happenedOn, title, letter, coverPhoto } = req.body;
      const existing = await prisma.anniversary.findUnique({ where: { userId: session.user.id } });
      
      let anniversary;
      if (existing) {
        anniversary = await prisma.anniversary.update({
          where: { userId: session.user.id },
          data: { happenedOn: new Date(happenedOn), title, letter, coverPhoto },
        });
      } else {
        anniversary = await prisma.anniversary.create({
          data: { userId: session.user.id, happenedOn: new Date(happenedOn), title: title ?? 'Our Anniversary', letter, coverPhoto },
        });
      }
      
      await prisma.keepEvent.create({
        data: {
          userId: session.user.id,
          kind: 'anniversary_tended',
          refId: anniversary.id,
          title: anniversary.title,
          bodyExcerpt: anniversary.letter.slice(0, 120),
          thumbData: anniversary.coverPhoto ?? undefined,
          href: '/anniversary',
        },
      });
      
      res.json({ success: true, data: { id: anniversary.id } });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to save anniversary' });
    }
  });

  app.patch('/api/anniversary', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const action = req.query.action;
      
      if (action === 'moment' && id) {
        const data = req.body;
        const moment = await prisma.anniversaryMoment.findFirst({
          where: { id, userId: session.user.id },
          include: { anniversary: true },
        });
        if (!moment) return res.status(404).json({ success: false, error: 'Not found' });
        
        await prisma.anniversaryMoment.update({ where: { id }, data });
        return res.json({ success: true });
      }
      
      if (id) {
        const data = req.body;
        const anniversary = await prisma.anniversary.findFirst({ where: { id, userId: session.user.id } });
        if (!anniversary) return res.status(404).json({ success: false, error: 'Not found' });
        
        await prisma.anniversary.update({ where: { id }, data });
        return res.json({ success: true });
      }
      
      res.status(400).json({ success: false, error: 'Missing id' });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to update anniversary' });
    }
  });

  app.delete('/api/anniversary', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const id = req.query.id as string;
      const action = req.query.action;
      
      if (action === 'moment' && id) {
        const moment = await prisma.anniversaryMoment.findFirst({ where: { id, userId: session.user.id } });
        if (!moment) return res.status(404).json({ success: false, error: 'Not found' });
        
        await prisma.anniversaryMoment.delete({ where: { id } });
        return res.json({ success: true });
      }
      
      res.status(400).json({ success: false, error: 'Invalid request' });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete' });
    }
  });

  app.post('/api/anniversary/reorder', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { ids } = req.body;
      await prisma.$transaction(
        ids.map((id: string, index: number) =>
          prisma.anniversaryMoment.update({
            where: { id, userId: session.user.id },
            data: { sortOrder: index },
          })
        )
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to reorder moments' });
    }
  });

  // Wallpaper routes
  app.get('/api/wallpapers', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
      
      const wallpapers = await prisma.wallpaper.findMany({
        where: { userId: session.user.id },
      });
      
      res.json(wallpapers);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load wallpapers' });
    }
  });

  app.post('/api/wallpapers', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const { pageKey, imageData, overlay, isGlobal } = req.body;
      
      if (isGlobal) {
        const pages = ['home', 'occasions', 'moods', 'feelings', 'timeline', 'anniversary', 'quotes'];
        await prisma.$transaction(
          pages.map(pk =>
            prisma.wallpaper.upsert({
              where: { userId_pageKey: { userId: session.user.id, pageKey: pk } },
              update: { imageData, overlay },
              create: { userId: session.user.id, pageKey: pk, imageData, overlay, isGlobal: true },
            })
          )
        );
      } else {
        await prisma.wallpaper.upsert({
          where: { userId_pageKey: { userId: session.user.id, pageKey } },
          update: { imageData, overlay },
          create: { userId: session.user.id, pageKey, imageData, overlay, isGlobal: false },
        });
      }
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to save wallpaper' });
    }
  });

  app.delete('/api/wallpapers', async (req, res) => {
    try {
      if (!withDb) return res.status(503).json({ success: false, error: 'Database not available' });
      const prisma = withDb();
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      
      const pageKey = req.query.pageKey as string;
      if (!pageKey) return res.status(400).json({ success: false, error: 'Missing pageKey' });
      
      await prisma.wallpaper.deleteMany({ where: { userId: session.user.id, pageKey } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Failed to delete wallpaper' });
    }
  });

  // Auth magic link
  app.post('/api/auth/send-magic-link', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Magic link for:', email);
        return res.json({ success: true });
      }
      
      await auth.api.sendMagicLink({ body: { email } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to send magic link' });
    }
  });

  // Session
  app.get('/api/auth/session', async (req, res) => {
    const session = await auth.api.getSession({ headers: req.headers });
    res.json({ user: session?.user || null });
  });

  // Start server
  // Serve static frontend files from Vite build output


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

// SPA fallback for routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});

}

startServer().catch(console.error);