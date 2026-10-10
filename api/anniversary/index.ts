import { getCurrentUser } from '@/server/space';
import { upsertAnniversary, createAnniversaryMoment, updateAnniversaryMoment, deleteAnniversaryMoment, reorderAnniversaryMoments } from '@/server/mutations/anniversary';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const anniversary = await prisma.anniversary.findUnique({
    where: { userId: user.id },
    include: { moments: { orderBy: { sortOrder: 'asc' } } },
  });
  
  return Response.json(anniversary);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'moment') {
    const data = await request.json();
    const result = await createAnniversaryMoment(request, data);
    return Response.json(result);
  }
  
  const data = await request.json();
  const result = await upsertAnniversary(request, data);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');
  
  if (action === 'moment' && id) {
    const data = await request.json();
    const result = await updateAnniversaryMoment(request, id, data);
    return Response.json(result);
  }
  
  if (id) {
    const data = await request.json();
    const result = await upsertAnniversary(request, { ...data, happenedOn: new Date(data.happenedOn) });
    return Response.json(result);
  }
  
  return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');
  
  if (action === 'moment' && id) {
    const result = await deleteAnniversaryMoment(request, id);
    return Response.json(result);
  }
  
  return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
}