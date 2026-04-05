import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { detectLocaleFromHeader } from '@/lib/i18n/detect-locale';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== '/') {
    return NextResponse.next();
  }

  const locale = detectLocaleFromHeader(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;

  return NextResponse.redirect(url);
}

export const proxy = middleware;

export const config = {
  matcher: ['/'],
};
