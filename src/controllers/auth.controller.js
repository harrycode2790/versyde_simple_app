import {
  authenticateGoogleUser,
  authenticateLinkedInUser,
  buildGoogleAuthorizationUrl,
  buildLinkedInAuthorizationUrl,
  getCurrentUserProfile,
  handleGoogleCallbackCode,
  handleLinkedInCallbackCode,
  login,
  register
} from '../services/auth.service.js';
import { env } from '../config/env.js';

const buildAuthSuccessRedirectUrl = (token) => {
  if (!env.frontendUrl) {
    const error = new Error('FRONTEND_URL environment variable is missing.');
    error.statusCode = 500;
    throw error;
  }

  const redirectUrl = new URL('/auth-success.html', env.frontendUrl);
  redirectUrl.searchParams.set('token', token);
  return redirectUrl.toString();
};

export const registerUser = async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const authenticateWithGoogle = async (req, res, next) => {
  try {
    const result = await authenticateGoogleUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getGoogleAuthorizationUrl = async (_req, res, next) => {
  try {
    const authorizationUrl = await buildGoogleAuthorizationUrl();
    res.redirect(302, authorizationUrl);
  } catch (error) {
    next(error);
  }
};

export const handleGoogleCallback = async (req, res, next) => {
  try {
    const result = await handleGoogleCallbackCode(req.query.code);
    res.redirect(302, buildAuthSuccessRedirectUrl(result.token));
  } catch (error) {
    next(error);
  }
};

export const authenticateWithLinkedIn = async (req, res, next) => {
  try {
    const result = await authenticateLinkedInUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getLinkedInAuthorizationUrl = async (_req, res, next) => {
  try {
    const authorizationUrl = await buildLinkedInAuthorizationUrl();
    res.redirect(302, authorizationUrl);
  } catch (error) {
    next(error);
  }
};

export const handleLinkedInCallback = async (req, res, next) => {
  try {
    const result = await handleLinkedInCallbackCode(req.query.code);
    res.redirect(302, buildAuthSuccessRedirectUrl(result.token));
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const result = await getCurrentUserProfile(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
