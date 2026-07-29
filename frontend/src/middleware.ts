import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if we are trying to access a dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('codentra_auth');

    // If there is no auth cookie, redirect to the login page
    if (!authCookie || authCookie.value !== 'authenticated') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow access if the user is authenticated or visiting a public route
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all dashboard routes
  matcher: ['/dashboard/:path*'],
};
