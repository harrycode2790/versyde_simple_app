import {
  applyToJob,
  createJob,
  getJobById,
  listJobs,
  listMyJobs
} from '../services/job.service.js';

export const createJobHandler = async (req, res, next) => {
  try {
    const result = await createJob(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const listJobsHandler = async (_req, res, next) => {
  try {
    const result = await listJobs();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getJobByIdHandler = async (req, res, next) => {
  try {
    const result = await getJobById(req.params.jobId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const applyToJobHandler = async (req, res, next) => {
  try {
    const result = await applyToJob(req.params.jobId, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const listMyJobsHandler = async (req, res, next) => {
  try {
    const result = await listMyJobs(req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
