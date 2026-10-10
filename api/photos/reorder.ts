import { reorderPhotos } from '@/server/mutations/photo';

export async function POST(request: Request) {
  const { albumType, albumId, ids } = await request.json();
  const result = await reorderPhotos(request, albumType, albumId, ids);
  return Response.json(result);
}