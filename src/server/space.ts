import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { CreateEventInput, EventKind } from '@/types';

export async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user;
}

export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function getSpace(userId: string) {
  return prisma.space.findUnique({
    where: { userId },
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
}

export async function getSpaceByShareToken(token: string) {
  return prisma.space.findUnique({
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
}

export async function createEvent(userId: string, input: CreateEventInput) {
  return prisma.keepEvent.create({
    data: {
      userId,
      kind: input.kind,
      refId: input.refId,
      title: input.title,
      bodyExcerpt: input.bodyExcerpt,
      thumbData: input.thumbData,
      href: input.href,
    },
  });
}

export async function backfillEvents(userId: string) {
  const space = await prisma.space.findUnique({ where: { userId } });
  if (!space) return;

  const existingEvents = await prisma.keepEvent.findMany({
    where: { userId },
    select: { kind: true, refId: true },
  });
  const existingKeys = new Set(existingEvents.map(e => `${e.kind}:${e.refId}`));

  const occasions = await prisma.occasion.findMany({ where: { userId } });
  for (const o of occasions) {
    const key = `occasion_opened:${o.id}`;
    if (!existingKeys.has(key)) {
      await createEvent(userId, {
        kind: 'occasion_opened',
        refId: o.id,
        title: o.title,
        bodyExcerpt: o.note ?? undefined,
        thumbData: o.coverPhoto ?? undefined,
        href: `/occasions/${o.id}`,
      });
      existingKeys.add(key);
    }
    for (const p of await prisma.photo.findMany({ where: { albumType: 'occasion', albumId: o.id } })) {
      const pKey = `photo_kept:${p.id}`;
      if (!existingKeys.has(pKey)) {
        await createEvent(userId, {
          kind: 'photo_kept',
          refId: p.id,
          title: o.title,
          bodyExcerpt: p.caption ?? undefined,
          thumbData: p.thumbData,
          href: `/occasions/${o.id}`,
        });
        existingKeys.add(pKey);
      }
    }
  }

  const moods = await prisma.mood.findMany({ where: { userId } });
  for (const m of moods) {
    const key = `mood_named:${m.id}`;
    if (!existingKeys.has(key)) {
      await createEvent(userId, {
        kind: 'mood_named',
        refId: m.id,
        title: m.title,
        bodyExcerpt: m.note ?? undefined,
        thumbData: m.coverPhoto ?? undefined,
        href: `/moods/${m.id}`,
      });
      existingKeys.add(key);
    }
    for (const p of await prisma.photo.findMany({ where: { albumType: 'mood', albumId: m.id } })) {
      const pKey = `photo_kept:${p.id}`;
      if (!existingKeys.has(pKey)) {
        await createEvent(userId, {
          kind: 'photo_kept',
          refId: p.id,
          title: m.title,
          bodyExcerpt: p.caption ?? undefined,
          thumbData: p.thumbData,
          href: `/moods/${m.id}`,
        });
        existingKeys.add(pKey);
      }
    }
  }

  const feelings = await prisma.feeling.findMany({ where: { userId } });
  for (const f of feelings) {
    const key = `letter_written:${f.id}`;
    if (!existingKeys.has(key)) {
      await createEvent(userId, {
        kind: 'letter_written',
        refId: f.id,
        title: 'A feeling kept',
        bodyExcerpt: f.body.slice(0, 120),
        thumbData: f.stampThumb ?? undefined,
        href: `/feelings/${f.id}`,
      });
      existingKeys.add(key);
    }
  }

  const quotes = await prisma.quote.findMany({ where: { userId } });
  for (const q of quotes) {
    const key = `quote_kept:${q.id}`;
    if (!existingKeys.has(key)) {
      await createEvent(userId, {
        kind: 'quote_kept',
        refId: q.id,
        title: 'A quote kept',
        bodyExcerpt: q.body.slice(0, 120),
        href: `/quotes`,
      });
      existingKeys.add(key);
    }
  }

  const anniversary = await prisma.anniversary.findUnique({ where: { userId } });
  if (anniversary) {
    const key = `anniversary_tended:${anniversary.id}`;
    if (!existingKeys.has(key)) {
      await createEvent(userId, {
        kind: 'anniversary_tended',
        refId: anniversary.id,
        title: anniversary.title,
        bodyExcerpt: anniversary.letter.slice(0, 120),
        thumbData: anniversary.coverPhoto ?? undefined,
        href: `/anniversary`,
      });
      existingKeys.add(key);
    }
    for (const m of await prisma.anniversaryMoment.findMany({ where: { anniversaryId: anniversary.id } })) {
      const mKey = `moment_added:${m.id}`;
      if (!existingKeys.has(mKey)) {
        await createEvent(userId, {
          kind: 'moment_added',
          refId: m.id,
          title: m.title,
          bodyExcerpt: m.body.slice(0, 120),
          thumbData: m.photoThumb ?? undefined,
          href: `/anniversary`,
        });
        existingKeys.add(mKey);
      }
    }
  }
}