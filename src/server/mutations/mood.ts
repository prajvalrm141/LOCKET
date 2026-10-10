import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function createMood(request: Request, data: { title: string; note?: string }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const mood = await prisma.mood.create({
      data: {
        userId: user.id,
        title: data.title,
        note: data.note,
      },
    });

    await createEvent(user.id, {
      kind: 'mood_named',
      refId: mood.id,
      title: mood.title,
      bodyExcerpt: mood.note ?? undefined,
      href: `/moods/${mood.id}`,
    });

    return { success: true, data: { id: mood.id } };
  } catch (e) {
    return { success: false, error: 'Failed to create mood' };
  }
}

export async function updateMood(request: Request, id: string, data: { title?: string; note?: string; coverPhoto?: string }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const mood = await prisma.mood.findFirst({ where: { id, userId: user.id } });
    if (!mood) return { success: false, error: 'Not found' };

    await prisma.mood.update({
      where: { id },
      data: { title: data.title, note: data.note, coverPhoto: data.coverPhoto },
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update mood' };
  }
}

export async function deleteMood(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const mood = await prisma.mood.findFirst({ where: { id, userId: user.id } });
    if (!mood) return { success: false, error: 'Not found' };

    await prisma.$transaction([
      prisma.photo.deleteMany({ where: { albumType: 'mood', albumId: id } }),
      prisma.mood.delete({ where: { id } }),
    ]);

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete mood' };
  }
}

export async function reorderMoods(request: Request, ids: string[]): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.mood.update({
          where: { id, userId: user.id },
          data: { updatedAt: new Date(Date.now() + index) },
        })
      )
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to reorder' };
  }
}