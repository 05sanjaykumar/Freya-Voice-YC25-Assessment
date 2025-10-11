// app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { token } = await req.json();
  
  if (token === 'dev') {
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', 'dev-user', {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return response;
  }
  
  return NextResponse.json({ error: 'Invalid' }, { status: 401 });
}
