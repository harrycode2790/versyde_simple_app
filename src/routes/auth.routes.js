import { Router } from 'express';
import {
  authenticateWithGoogle,
  authenticateWithLinkedIn,
  getGoogleAuthorizationUrl,
  getCurrentUser,
  getLinkedInAuthorizationUrl,
  handleGoogleCallback,
  handleLinkedInCallback,
  loginUser,
  registerUser
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/google/start', getGoogleAuthorizationUrl);
router.get('/google/callback', handleGoogleCallback);
router.post('/google', authenticateWithGoogle);
router.get('/linkedin/start', getLinkedInAuthorizationUrl);
router.get('/linkedin/callback', handleLinkedInCallback);
router.post('/linkedin', authenticateWithLinkedIn);
router.get('/me', requireAuth, getCurrentUser);

export default router;
