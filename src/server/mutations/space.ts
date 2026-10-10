import { prisma } from '@/lib/db';
import { createEvent, getCurrentUser } from '@/server/space';
import type { MutationResult } from '@/types';

export async function updateSpace(request: Request, data: {
  title?: string;
  dedication?: string;
  herName?: string;
  ownerName?: string;
}): Promise<MutationResult<{ title: string; dedication: string; herName: string; ownerName: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const space = await prisma.space.update({
      where: { userId: user.id },
      data: {
        title: data.title,
        dedication: data.dedication,
        herName: data.herName,
        ownerName: data.ownerName,
      },
    });

    await createEvent(user.id, {
      kind: 'opening_words_tended',
      title: 'Opening words tended',
      bodyExcerpt: space.dedication.slice(0, 120),
      href: '/',
    });

    return { success: true, data: { title: space.title, dedication: space.dedication, herName: space.herName, ownerName: space.ownerName } };
  } catch (e) {
    return { success: false, error: 'Failed to update keep' };
  }
}

export async function toggleShare(request: Request, enabled: boolean): Promise<MutationResult<{ shareEnabled: boolean; shareUrl?: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const space = await prisma.space.update({
      where: { userId: user.id },
      data: { shareEnabled: enabled },
    });

    const shareUrl = enabled ? `${process.env.APP_URL}/for-you/${space.shareToken}` : undefined;

    return { success: true, data: { shareEnabled: space.shareEnabled, shareUrl } };
  } catch (e) {
    return { success: false, error: 'Failed to update sharing' };
  }
}

export async function rotateShareToken(request: Request): Promise<MutationResult<{ shareToken: string; shareUrl: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const newToken = crypto.randomUUID();
    const space = await prisma.space.update({
      where: { userId: user.id },
      data: { shareToken: newToken },
    });

    const shareUrl = `${process.env.APP_URL}/for-you/${space.shareToken}`;

    return { success: true, data: { shareToken: space.shareToken, shareUrl } };
  } catch (e) {
    return { success: false, error: 'Failed to rotate token' };
  }
}