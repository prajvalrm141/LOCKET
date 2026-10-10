import { getCurrentUser } from '@/server/space';
import { createQuote, updateQuote, deleteQuote, reorderQuotes } from '@/server/mutations/quote';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const quotes = await prisma.quote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  return Response.json(quotes);
}

export async function POST(request: Request) {
  const data = await request.json();
  const result = await createQuote(request, data);
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const data = await request.json();
  const result = await updateQuote(request, id, data);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  const result = await deleteQuote(request, id);
  return Response.json(result);
}