import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function createOccasion(request: Request, data: { title: string; note?: string; date?: Date }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const occasion = await prisma.occasion.create({
      data: {
        userId: user.id,
        title: data.title,
        note: data.note,
        date: data.date,
      },
    });

    await createEvent(user.id, {
      kind: 'occasion_opened',
      refId: occasion.id,
      title: occasion.title,
      bodyExcerpt: occasion.note ?? undefined,
      href: `/occasions/${occasion.id}`,
    });

    return { success: true, data: { id: occasion.id } };
  } catch (e) {
    return { success: false, error: 'Failed to create occasion' };
  }
}

export async function updateOccasion(request: Request, id: string, data: { title?: string; note?: string; date?: Date; coverPhoto?: string }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const occasion = await prisma.occasion.findFirst({ where: { id, userId: user.id } });
    if (!occasion) return { success: false, error: 'Not found' };

    await prisma.occasion.update({
      where: { id },
      data: { title: data.title, note: data.note, date: data.date, coverPhoto: data.coverPhoto },
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update occasion' };
  }
}

export async function deleteOccasion(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const occasion = await prisma.occasion.findFirst({ where: { id, userId: user.id } });
    if (!occasion) return { success: false, error: 'Not found' };

    await prisma.$transaction([
      prisma.photo.deleteMany({ where: { albumType: 'occasion', albumId: id } }),
      prisma.occasion.delete({ where: { id } }),
    ]);

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete occasion' };
  }
}

export async function reorderOccasions(request: Request, ids: string[]): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.occasion.update({
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