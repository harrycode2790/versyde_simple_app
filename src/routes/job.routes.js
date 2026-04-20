import { Router } from 'express';
import {
  applyToJobHandler,
  createJobHandler,
  getJobByIdHandler,
  listJobsHandler,
  listMyJobsHandler,
} from '../controllers/job.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', listJobsHandler);
router.get('/me', requireAuth, listMyJobsHandler);
router.get('/:jobId', getJobByIdHandler);
router.post('/', requireAuth, createJobHandler);
router.post('/:jobId/apply', requireAuth, applyToJobHandler);

export default router;
