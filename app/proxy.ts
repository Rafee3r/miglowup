import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Excluye assets estáticos, sw.js, manifest, robots, sitemap, .well-known
  // para que el proxy de auth no los intercepte
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map)$).*)'],
};
