import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function upsertWallpaper(request: Request, pageKey: string, imageData: string, overlay: number, isGlobal: boolean): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    if (isGlobal) {
      const pages = ['home', 'occasions', 'moods', 'feelings', 'timeline', 'anniversary', 'quotes'];
      await prisma.$transaction(
        pages.map(pk =>
          prisma.wallpaper.upsert({
            where: { userId_pageKey: { userId: user.id, pageKey: pk } },
            update: { imageData, overlay },
            create: { userId: user.id, pageKey: pk, imageData, overlay, isGlobal: true },
          })
        )
      );
    } else {
      await prisma.wallpaper.upsert({
        where: { userId_pageKey: { userId: user.id, pageKey } },
        update: { imageData, overlay },
        create: { userId: user.id, pageKey, imageData, overlay, isGlobal: false },
      });
    }

    await createEvent(user.id, {
      kind: 'wallpaper_set',
      title: 'Wallpaper changed',
      bodyExcerpt: isGlobal ? 'Applied to all pages' : `Applied to ${pageKey}`,
      href: `/${pageKey}`,
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to save wallpaper' };
  }
}

export async function deleteWallpaper(request: Request, pageKey: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.wallpaper.deleteMany({ where: { userId: user.id, pageKey } });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete wallpaper' };
  }
}