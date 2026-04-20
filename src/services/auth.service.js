import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const LINKEDIN_AUTHORIZATION_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt
});

const ensureAuthConfig = () => {
  if (!env.jwtSecret) {
    throw createHttpError(500, 'JWT configuration is missing.');
  }
};

const ensureGoogleConfig = () => {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw createHttpError(500, 'Google OAuth environment variables are missing.');
  }
};

const ensureLinkedInConfig = () => {
  if (!env.linkedinClientId || !env.linkedinClientSecret || !env.linkedinRedirectUri) {
    throw createHttpError(500, 'LinkedIn OAuth environment variables are missing.');
  }
};

export const buildGoogleAuthorizationUrl = async () => {
  ensureGoogleConfig();

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const buildLinkedInAuthorizationUrl = async () => {
  ensureLinkedInConfig();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.linkedinClientId,
    redirect_uri: env.linkedinRedirectUri,
    scope: 'openid profile email'
  });

  return `${LINKEDIN_AUTHORIZATION_URL}?${params.toString()}`;
};

const exchangeGoogleCodeForTokens = async (code) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw createHttpError(400, data.error_description || 'Failed to exchange Google authorization code.');
  }

  return data;
};

const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw createHttpError(400, data.error_description || 'Failed to fetch Google profile.');
  }

  return data;
};

const exchangeLinkedInCodeForTokens = async (code) => {
  try {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: env.linkedinClientId,
        client_secret: env.linkedinClientSecret,
        redirect_uri: env.linkedinRedirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw createHttpError(400, data.error_description || 'Failed to exchange LinkedIn authorization code.');
    }

    return data;
  } catch (error) {
    throw createHttpError(
      500,
      `LinkedIn token exchange failed: ${error.message || 'Unknown fetch error.'}`
    );
  }
};

const fetchLinkedInProfile = async (accessToken) => {
  try {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw createHttpError(400, data.message || 'Failed to fetch LinkedIn profile.');
    }

    return data;
  } catch (error) {
    throw createHttpError(
      500,
      `LinkedIn profile fetch failed: ${error.message || 'Unknown fetch error.'}`
    );
  }
};

const findOrCreateGoogleUser = async (profile) => {
  const providerAccountId = profile.sub;
  const email = profile.email?.toLowerCase().trim();
  const isTrustedEmail = Boolean(email && profile.email_verified);

  if (!providerAccountId) {
    throw createHttpError(400, 'Google account did not return a valid account identifier.');
  }

  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'GOOGLE',
        providerAccountId
      }
    },
    include: {
      user: true
    }
  });

  if (existingAccount) {
    return existingAccount.user;
  }

  if (!isTrustedEmail) {
    throw createHttpError(400, 'Google account did not return a trusted email, so automatic linking was skipped.');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existingUser) {
    await prisma.authAccount.create({
      data: {
        provider: 'GOOGLE',
        providerAccountId,
        email,
        userId: existingUser.id
      }
    });

    return prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        fullName: existingUser.fullName || profile.name || null,
        avatarUrl: existingUser.avatarUrl || profile.picture || null
      }
    });
  }

  return prisma.user.create({
    data: {
      email,
      fullName: profile.name || null,
      avatarUrl: profile.picture || null,
      authAccounts: {
        create: {
          provider: 'GOOGLE',
          providerAccountId,
          email
        }
      }
    }
  });
};

const findOrCreateLinkedInUser = async (profile) => {
  const providerAccountId = profile.sub;
  const email = profile.email?.toLowerCase().trim();
  const isTrustedEmail = Boolean(email && profile.email_verified !== false);

  if (!providerAccountId) {
    throw createHttpError(400, 'LinkedIn account did not return a valid account identifier.');
  }

  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'LINKEDIN',
        providerAccountId
      }
    },
    include: {
      user: true
    }
  });

  if (existingAccount) {
    return existingAccount.user;
  }

  if (!isTrustedEmail) {
    throw createHttpError(400, 'LinkedIn account did not return a trusted email, so automatic linking was skipped.');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existingUser) {
    await prisma.authAccount.create({
      data: {
        provider: 'LINKEDIN',
        providerAccountId,
        email,
        userId: existingUser.id
      }
    });

    return prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        fullName: existingUser.fullName || profile.name || null,
        avatarUrl: existingUser.avatarUrl || profile.picture || null
      }
    });
  }

  return prisma.user.create({
    data: {
      email,
      fullName: profile.name || null,
      avatarUrl: profile.picture || null,
      authAccounts: {
        create: {
          provider: 'LINKEDIN',
          providerAccountId,
          email
        }
      }
    }
  });
};

export const register = async (payload) => {
  return {
    message: 'Register service placeholder',
    payload
  };
};

export const login = async (payload) => {
  return {
    message: 'Login service placeholder',
    payload
  };
};

export const authenticateGoogleUser = async ({ code }) => {
  ensureAuthConfig();
  ensureGoogleConfig();

  if (!code) {
    throw createHttpError(400, 'Google authorization code is required.');
  }

  const tokens = await exchangeGoogleCodeForTokens(code);

  if (!tokens.access_token) {
    throw createHttpError(400, 'Google did not return an access token.');
  }

  const profile = await fetchGoogleProfile(tokens.access_token);
  const user = await findOrCreateGoogleUser(profile);
  const token = signAuthToken(user);

  return {
    message: 'Google authentication successful.',
    token,
    user: serializeUser(user)
  };
};

export const handleGoogleCallbackCode = async (code) => authenticateGoogleUser({ code });

export const authenticateLinkedInUser = async ({ code }) => {
  ensureAuthConfig();
  ensureLinkedInConfig();

  if (!code) {
    throw createHttpError(400, 'LinkedIn authorization code is required.');
  }

  const tokens = await exchangeLinkedInCodeForTokens(code);

  if (!tokens.access_token) {
    throw createHttpError(400, 'LinkedIn did not return an access token.');
  }

  const profile = await fetchLinkedInProfile(tokens.access_token);
  const user = await findOrCreateLinkedInUser(profile);
  const token = signAuthToken(user);

  return {
    message: 'LinkedIn authentication successful.',
    token,
    user: serializeUser(user)
  };
};

export const handleLinkedInCallbackCode = async (code) => authenticateLinkedInUser({ code });

export const getCurrentUserProfile = async (user) => {
  ensureAuthConfig();

  if (!user?.id) {
    throw createHttpError(401, 'Authenticated user context is missing.');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  });

  if (!existingUser) {
    throw createHttpError(404, 'User not found.');
  }

  return {
    message: 'Current user profile fetched successfully.',
    user: serializeUser(existingUser)
  };
};
