import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
  }

  const mobileRedirect = request.nextUrl.searchParams.get('mobile_redirect');

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gymfire.vercel.app'}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (mobileRedirect) {
    params.set('state', JSON.stringify({ mobile_redirect: mobileRedirect }));
  }

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
