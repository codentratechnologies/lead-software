import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Verify against hardcoded credentials
    if (email === 'codentratechnologies@gmail.com' && password === 'Codentra@123') {
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );
      
      // Set an HTTP-only cookie to maintain the session
      // For production, Secure should be true (requires HTTPS)
      response.cookies.set({
        name: 'codentra_auth',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
