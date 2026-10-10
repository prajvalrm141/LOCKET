import { reorderOccasions } from '@/server/mutations/occasion';

export async function POST(request: Request) {
  const { ids } = await request.json();
  const result = await reorderOccasions(request, ids);
  return Response.json(result);
}