import { getCurrentUser } from '@/server/space';
import { createMood, updateMood, deleteMood, reorderMoods } from '@/server/mutations/mood';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const moods = await prisma.mood.findMany({
    where: { userId: user.id },
    include: { photos: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  
  return Response.json(moods);
}

export async function POST(request: Request) {
  const data = await request.json();
  const result = await createMood(request, data);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const data = await request.json();
  const result = await updateMood(request, id, data);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const result = await deleteMood(request, id);
  return Response.json(result);
}