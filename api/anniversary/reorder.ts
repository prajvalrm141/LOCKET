import { reorderAnniversaryMoments } from '@/server/mutations/anniversary';

export async function POST(request: Request) {
  const { ids } = await request.json();
  const result = await reorderAnniversaryMoments(request, ids);
  return Response.json(result);
}