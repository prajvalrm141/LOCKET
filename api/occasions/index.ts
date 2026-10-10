import { getCurrentUser } from '@/server/space';
import { createOccasion, updateOccasion, deleteOccasion, reorderOccasions } from '@/server/mutations/occasion';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const occasions = await prisma.occasion.findMany({
    where: { userId: user.id },
    include: { photos: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  
  return Response.json(occasions);
}

export async function POST(request: Request) {
  const data = await request.json();
  const result = await createOccasion(request, data);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const data = await request.json();
  const result = await updateOccasion(request, id, data);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const result = await deleteOccasion(request, id);
  return Response.json(result);
}