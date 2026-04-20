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
    res.status(200).json(result);
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
    res.status(200).json(result);
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
