import { updateSpace, toggleShare, rotateShareToken } from '@/server/mutations/space';

export async function PATCH(request: Request) {
  const data = await request.json();
  const result = await updateSpace(request, data);
  return Response.json(result);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'toggle-share') {
    const { enabled } = await request.json();
    const result = await toggleShare(request, enabled);
    return Response.json(result);
  }
  
  if (action === 'rotate-token') {
    const result = await rotateShareToken(request);
    return Response.json(result);
  }
  
  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
}