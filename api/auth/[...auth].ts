import { auth } from '@/lib/auth';
import { createAuthMiddleware } from '@tanstack/react-router';

export const { GET, POST } = createAuthMiddleware(auth.handler);