import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccessToken, createRefreshToken } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gymfire.vercel.app'}/api/auth/callback/google`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google token error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url));
    }

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();
    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=no_email', request.url));
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          { oauthAccounts: { some: { provider: 'google', providerId: googleUser.id } } },
        ],
      },
      include: { oauthAccounts: true },
    });

    if (!user) {
      // Create new user
      const baseUsername = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          username,
          displayName: googleUser.name || username,
          avatarUrl: googleUser.picture || null,
          isVerified: googleUser.verified_email || false,
          oauthAccounts: {
            create: {
              provider: 'google',
              providerId: googleUser.id,
            },
          },
        },
        include: { oauthAccounts: true },
      });
    } else {
      // Ensure OAuth account is linked
      const hasGoogleOAuth = user.oauthAccounts?.some(
        (a) => a.provider === 'google' && a.providerId === googleUser.id
      );
      if (!hasGoogleOAuth) {
        await prisma.oAuthAccount.create({
          data: {
            provider: 'google',
            providerId: googleUser.id,
            userId: user.id,
          },
        });
      }
      // Update avatar if not set
      if (!user.avatarUrl && googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: googleUser.picture },
        });
      }
    }

    // Create JWT tokens
    const accessToken = createAccessToken(user.id, user.username);
    const refreshToken = createRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Redirect to frontend with tokens
    const userInfo = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };

    const tokenParams = new URLSearchParams({
      access_token: accessToken,
      refresh_token: refreshToken,
      user_info: JSON.stringify(userInfo),
    });

    // Check if this is a mobile auth request
    const stateParam = request.nextUrl.searchParams.get('state');
    if (stateParam) {
      try {
        const state = JSON.parse(stateParam);
        if (state.mobile_redirect) {
          const mobileUrl = `${state.mobile_redirect}?${tokenParams.toString()}`;
          // Return HTML page that redirects via JS — NextResponse.redirect()
          // doesn't work with custom schemes (gymfire://, exp://) on Vercel
          return new NextResponse(
            `<!DOCTYPE html>
<html><head>
<meta http-equiv="refresh" content="0;url=${mobileUrl}" />
<script>window.location.href = ${JSON.stringify(mobileUrl)};</script>
</head><body>Redirecting...</body></html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      } catch {
        // Invalid state JSON, fall through to web redirect
      }
    }

    return NextResponse.redirect(new URL(`/auth/google/success?${tokenParams.toString()}`, request.url));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
