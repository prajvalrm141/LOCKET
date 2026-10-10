import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function createQuote(request: Request, data: { body: string; context?: string; saidOn?: Date }): Promise<MutationResult<{ id: string }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const quote = await prisma.quote.create({
      data: {
        userId: user.id,
        body: data.body,
        context: data.context,
        saidOn: data.saidOn,
      },
    });

    await createEvent(user.id, {
      kind: 'quote_kept',
      refId: quote.id,
      title: 'A quote kept',
      bodyExcerpt: quote.body.slice(0, 120),
      href: '/quotes',
    });

    return { success: true, data: { id: quote.id } };
  } catch (e) {
    return { success: false, error: 'Failed to create quote' };
  }
}

export async function updateQuote(request: Request, id: string, data: { body?: string; context?: string; saidOn?: Date | null }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const quote = await prisma.quote.findFirst({ where: { id, userId: user.id } });
    if (!quote) return { success: false, error: 'Not found' };

    await prisma.quote.update({ where: { id }, data });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update quote' };
  }
}

export async function deleteQuote(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const quote = await prisma.quote.findFirst({ where: { id, userId: user.id } });
    if (!quote) return { success: false, error: 'Not found' };

    await prisma.quote.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete quote' };
  }
}

export async function reorderQuotes(request: Request, ids: string[]): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.quote.update({
          where: { id, userId: user.id },
          data: { updatedAt: new Date(Date.now() + index) },
        })
      )
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to reorder quotes' };
  }
}