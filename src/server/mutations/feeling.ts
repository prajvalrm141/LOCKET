import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function createFeeling(request: Request, data: { body: string; feltAt: Date; stampData?: string; stampThumb?: string }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const feeling = await prisma.feeling.create({
      data: {
        userId: user.id,
        body: data.body,
        feltAt: data.feltAt,
        stampData: data.stampData,
        stampThumb: data.stampThumb,
      },
    });

    await createEvent(user.id, {
      kind: 'letter_written',
      refId: feeling.id,
      title: 'A feeling kept',
      bodyExcerpt: feeling.body.slice(0, 120),
      thumbData: feeling.stampThumb ?? undefined,
      href: `/feelings/${feeling.id}`,
    });

    return { success: true, data: { id: feeling.id } };
  } catch (e) {
    return { success: false, error: 'Failed to create feeling' };
  }
}

export async function updateFeeling(request: Request, id: string, data: { body?: string; feltAt?: Date; stampData?: string; stampThumb?: string }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const feeling = await prisma.feeling.findFirst({ where: { id, userId: user.id } });
    if (!feeling) return { success: false, error: 'Not found' };

    await prisma.feeling.update({ where: { id }, data });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update feeling' };
  }
}

export async function deleteFeeling(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const feeling = await prisma.feeling.findFirst({ where: { id, userId: user.id } });
    if (!feeling) return { success: false, error: 'Not found' };

    await prisma.feeling.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete feeling' };
  }
}