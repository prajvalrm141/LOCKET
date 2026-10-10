import { prisma } from '@/lib/db';
import { getCurrentUser, createEvent } from '@/server/space';
import type { MutationResult } from '@/types';

export async function uploadPhotos(request: Request, albumType: 'occasion' | 'mood', albumId: string, files: { imageData: string; thumbData: string; caption?: string }[]): Promise<MutationResult<{ count: number }>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const album = albumType === 'occasion'
      ? await prisma.occasion.findFirst({ where: { id: albumId, userId: user.id } })
      : await prisma.mood.findFirst({ where: { id: albumId, userId: user.id } });
    
    if (!album) return { success: false, error: 'Album not found' };

    const existingCount = await prisma.photo.count({ where: { albumType, albumId } });
    
    await prisma.$transaction(
      files.map((file, index) =>
        prisma.photo.create({
          data: {
            userId: user.id,
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

    const newPhotos = await prisma.photo.findMany({ where: { albumType, albumId, userId: user.id }, orderBy: { createdAt: 'desc' }, take: files.length });
    
    for (const photo of newPhotos) {
      await createEvent(user.id, {
        kind: 'photo_kept',
        refId: photo.id,
        title: album.title,
        bodyExcerpt: photo.caption ?? undefined,
        thumbData: photo.thumbData,
        href: `/${albumType}s/${albumId}`,
      });
    }

    return { success: true, data: { count: files.length } };
  } catch (e) {
    return { success: false, error: 'Failed to upload photos' };
  }
}

export async function updatePhoto(request: Request, id: string, data: { caption?: string; isCover?: boolean }): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const photo = await prisma.photo.findFirst({ where: { id, userId: user.id } });
    if (!photo) return { success: false, error: 'Not found' };

    if (data.isCover) {
      await prisma.photo.updateMany({
        where: { albumType: photo.albumType, albumId: photo.albumId, userId: user.id },
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
        if (photo.albumType === 'occasion') {
          await prisma.occasion.update({
            where: { id: photo.albumId },
            data: { coverPhoto: photo.imageData },
          });
        } else {
          await prisma.mood.update({
            where: { id: photo.albumId },
            data: { coverPhoto: photo.imageData },
          });
        }
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to update photo' };
  }
}

export async function deletePhoto(request: Request, id: string): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    const photo = await prisma.photo.findFirst({ where: { id, userId: user.id } });
    if (!photo) return { success: false, error: 'Not found' };

    await prisma.photo.delete({ where: { id } });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to delete photo' };
  }
}

export async function reorderPhotos(request: Request, albumType: 'occasion' | 'mood', albumId: string, ids: string[]): Promise<MutationResult<void>> {
  try {
    const user = await getCurrentUser(request);
    if (!user) return { success: false, error: 'Unauthorized' };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.photo.update({
          where: { id, userId: user.id, albumType, albumId },
          data: { sortOrder: index },
        })
      )
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to reorder photos' };
  }
}