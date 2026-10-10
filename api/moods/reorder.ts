import { reorderMoods } from '@/server/mutations/mood';

export async function POST(request: Request) {
  const { ids } = await request.json();
  const result = await reorderMoods(request, ids);
  return Response.json(result);
}