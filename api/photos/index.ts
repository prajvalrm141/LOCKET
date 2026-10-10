import { getCurrentUser } from '@/server/space';
import { uploadPhotos, updatePhoto, deletePhoto, reorderPhotos } from '@/server/mutations/photo';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const url = new URL(request.url);
  const albumType = url.searchParams.get('albumType');
  const albumId = url.searchParams.get('albumId');
  
  if (!albumType || !albumId) return Response.json({ error: 'Missing params' }, { status: 400 });
  
  const { prisma } = await import('@/lib/db');
  const photos = await prisma.photo.findMany({
    where: { userId: user.id, albumType, albumId },
    orderBy: { sortOrder: 'asc' },
  });
  
  return Response.json(photos);
}

export async function POST(request: Request) {
  const { albumType, albumId, files } = await request.json();
  const result = await uploadPhotos(request, albumType, albumId, files);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const data = await request.json();
  const result = await updatePhoto(request, id, data);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const result = await deletePhoto(request, id);
  return Response.json(result);
}