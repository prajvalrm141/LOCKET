import { getCurrentUser } from '@/server/space';
import { createFeeling, updateFeeling, deleteFeeling } from '@/server/mutations/feeling';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const feelings = await prisma.feeling.findMany({
    where: { userId: user.id },
    orderBy: { feltAt: 'desc' },
  });
  
  return Response.json(feelings);
}

export async function POST(request: Request) {
  const data = await request.json();
  const result = await createFeeling(request, data);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const data = await request.json();
  const result = await updateFeeling(request, id, data);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const result = await deleteFeeling(request, id);
  return Response.json(result);
}