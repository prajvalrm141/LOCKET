import { getSpace, getSpaceByShareToken } from '@/server/space';
import { getCurrentUser } from '@/server/space';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (token) {
    const space = await getSpaceByShareToken(token);
    if (!space) {
      return Response.json({ space: null, user: null, isReadOnly: true });
    }
    return Response.json({
      space: {
        id: space.id,
        title: space.title,
        dedication: space.dedication,
        herName: space.herName,
        ownerName: space.ownerName,
        shareToken: space.shareToken,
        shareEnabled: space.shareEnabled,
      },
      user: null,
      isReadOnly: true,
    });
  }
  
  const user = await getCurrentUser(request);
  if (!user) {
    return Response.json({ space: null, user: null, isReadOnly: false });
  }
  
  const space = await getSpace(user.id);
  return Response.json({
    space: space ? {
      id: space.id,
      title: space.title,
      dedication: space.dedication,
      herName: space.herName,
      ownerName: space.ownerName,
      shareToken: space.shareToken,
      shareEnabled: space.shareEnabled,
    } : null,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    isReadOnly: false,
  });
}