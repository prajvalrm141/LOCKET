import { getCurrentUser } from '@/server/space';
import { upsertWallpaper, deleteWallpaper } from '@/server/mutations/wallpaper';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { prisma } = await import('@/lib/db');
  const wallpapers = await prisma.wallpaper.findMany({
    where: { userId: user.id },
  });
  
  return Response.json(wallpapers);
}

export async function POST(request: Request) {
  const { pageKey, imageData, overlay, isGlobal } = await request.json();
  const result = await upsertWallpaper(request, pageKey, imageData, overlay, isGlobal);
  return Response.json(result);
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pageKey = url.searchParams.get('pageKey');
  if (!pageKey) return Response.json({ success: false, error: 'Missing pageKey' }, { status: 400 });
  
  const result = await deleteWallpaper(request, pageKey);
  return Response.json(result);
}