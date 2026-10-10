import { reorderQuotes } from '@/server/mutations/quote';

export async function POST(request: Request) {
  const { ids } = await request.json();
  const result = await reorderQuotes(request, ids);
  return Response.json(result);
}