import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function upsertAnniversary(request: Request, data: { happenedOn: Date; title?: string; letter: string; coverPhoto?: string }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const existing = await prisma.anniversary.findUnique({ where: { userId: user.id } });
    
    let anniversary;
    if (existing) {
      anniversary = await prisma.anniversary.update({
        where: { userId: user.id },
        data: { happenedOn: data.happenedOn, title: data.title, letter: data.letter, coverPhoto: data.coverPhoto },
      });
    } else {
      anniversary = await prisma.anniversary.create({
        data: { userId: user.id, happenedOn: data.happenedOn, title: data.title ?? 'Our Anniversary', letter: data.letter, coverPhoto: data.coverPhoto },
      });
    }

    await createEvent(user.id, {
      kind: 'anniversary_tended',
      refId: anniversary.id,
      title: anniversary.title,
      bodyExcerpt: anniversary.letter.slice(0, 120),
      thumbData: anniversary.coverPhoto ?? undefined,
      href: '/anniversary',
    });

    return { success: true, data: { id: anniversary.id } };
  } catch (e) {
    return { success: false, error: 'Failed to save anniversary' };
  }
}

export async function createAnniversaryMoment(request: Request, data: { title: string; body: string; year: number; date?: Date; photoData?: string; photoThumb?: string }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const anniversary = await prisma.anniversary.findUnique({ where: { userId: user.id } });
    if (!anniversary) return { success: false, error: 'Anniversary not set up' };

    const count = await prisma.anniversaryMoment.count({ where: { anniversaryId: anniversary.id } });
    
    const moment = await prisma.anniversaryMoment.create({
      data: {
        userId: user.id,
        anniversaryId: anniversary.id,
        title: data.title,
        body: data.body,
        year: data.year,
        date: data.date,
        photoData: data.photoData,
        photoThumb: data.photoThumb,
        sortOrder: count,
      },
    });

    await createEvent(user.id, {
      kind: 'moment_added',
      refId: moment.id,
      title: moment.title,
      bodyExcerpt: moment.body.slice(0, 120),
      thumbData: moment.photoThumb ?? undefined,
      href: '/anniversary',
    });

    return { success: true, data: { id: moment.id } };
  } catch (e) {
    return { success: false, error: 'Failed to add moment' };
  }
}

export async function updateAnniversaryMoment(request: Request, id: string, data: { title?: string; body?: string; year?: number; date?: Date | null; photoData?: string; photoThumb?: string }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const moment = await prisma.anniversaryMoment.findFirst({
      where: { id, userId: user.id },
      include: { anniversary: true },
    });
    if (!moment) return { success: false, error: 'Not found' };

    await prisma.anniversaryMoment.update({ where: { id }, data });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update moment' };
  }
}

export async function deleteAnniversaryMoment(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const moment = await prisma.anniversaryMoment.findFirst({ where: { id, userId: user.id } });
    if (!moment) return { success: false, error: 'Not found' };

    await prisma.anniversaryMoment.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete moment' };
  }
}

export async function reorderAnniversaryMoments(request: Request, ids: string[]): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.anniversaryMoment.update({
          where: { id, userId: user.id },
          data: { sortOrder: index },
        })
      )
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to reorder moments' };
  }
}