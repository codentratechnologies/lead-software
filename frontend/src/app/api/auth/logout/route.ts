import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie by setting maxAge to 0
  response.cookies.set({
    name: 'codentra_auth',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
