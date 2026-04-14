import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccessToken, createRefreshToken } from '@/lib/auth';

// POST /api/auth/google/token
// Mobile OAuth: receives Google auth code + PKCE verifier,
// exchanges for Google tokens, finds/creates user, returns JWT tokens.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri, codeVerifier, googleAccessToken } = body;

    let googleToken: string;

    if (googleAccessToken) {
      // Direct access token (legacy support)
      googleToken = googleAccessToken;
    } else if (code && redirectUri && codeVerifier) {
      // Exchange authorization code for access token using PKCE
      const clientId = process.env.GOOGLE_CLIENT_ID!;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error('Google token exchange error:', tokenData);
        return NextResponse.json(
          { message: 'Failed to exchange Google code' },
          { status: 401 },
        );
      }

      googleToken = tokenData.access_token;
    } else {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Fetch user info from Google
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${googleToken}` } },
    );

    if (!userInfoRes.ok) {
      return NextResponse.json(
        { message: 'Invalid Google token' },
        { status: 401 },
      );
    }

    const googleUser = await userInfoRes.json();
    if (!googleUser.email) {
      return NextResponse.json(
        { message: 'Google account has no email' },
        { status: 400 },
      );
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
      const hasGoogleOAuth = user.oauthAccounts?.some(
        (a) => a.provider === 'google' && a.providerId === googleUser.id,
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

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Google mobile auth error:', error);
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 500 },
    );
  }
}
