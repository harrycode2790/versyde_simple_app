import { prisma } from '../lib/prisma.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const serializeJob = (job) => ({
  id: job.id,
  title: job.title,
  description: job.description,
  salary: Number(job.salary),
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  createdBy: job.createdBy
    ? {
        id: job.createdBy.id,
        email: job.createdBy.email,
        fullName: job.createdBy.fullName
      }
    : undefined,
  applicationCount: job._count?.applications
});

const serializeApplication = (application) => ({
  id: application.id,
  createdAt: application.createdAt,
  job: application.job
    ? {
        id: application.job.id,
        title: application.job.title,
        description: application.job.description,
        salary: Number(application.job.salary),
        createdAt: application.job.createdAt,
        updatedAt: application.job.updatedAt
      }
    : undefined,
  applicant: application.applicant
    ? {
        id: application.applicant.id,
        email: application.applicant.email,
        fullName: application.applicant.fullName
      }
    : undefined
});

const ensureAuthenticatedUser = (user) => {
  if (!user?.id) {
    throw createHttpError(401, 'Authenticated user context is missing.');
  }
};

const validateJobPayload = (payload, { partial = false } = {}) => {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const salary =
    payload.salary === undefined || payload.salary === null || payload.salary === ''
      ? undefined
      : Number(payload.salary);

  if (!partial || payload.title !== undefined) {
    if (!title) {
      throw createHttpError(400, 'Job title is required.');
    }
  }

  if (!partial || payload.description !== undefined) {
    if (!description) {
      throw createHttpError(400, 'Job description is required.');
    }
  }

  if (!partial || payload.salary !== undefined) {
    if (salary === undefined || Number.isNaN(salary) || salary < 0) {
      throw createHttpError(400, 'Job salary must be a valid non-negative number.');
    }
  }

  return {
    ...(payload.title !== undefined || !partial ? { title } : {}),
    ...(payload.description !== undefined || !partial ? { description } : {}),
    ...(payload.salary !== undefined || !partial ? { salary } : {})
  };
};

const getJobOrThrow = async (jobId) => {
  const job = await prisma.job.findUnique({
    where: {
      id: jobId
    },
    include: {
      createdBy: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  if (!job) {
    throw createHttpError(404, 'Job not found.');
  }

  return job;
};

export const createJob = async (payload, user) => {
  ensureAuthenticatedUser(user);

  const data = validateJobPayload(payload);

  const job = await prisma.job.create({
    data: {
      ...data,
      createdById: user.id
    },
    include: {
      createdBy: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  return {
    message: 'Job created successfully.',
    job: serializeJob(job)
  };
};

export const listJobs = async () => {
  const jobs = await prisma.job.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      createdBy: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  return {
    message: 'Jobs fetched successfully.',
    jobs: jobs.map(serializeJob)
  };
};

export const getJobById = async (jobId) => {
  const job = await getJobOrThrow(jobId);

  return {
    message: 'Job fetched successfully.',
    job: serializeJob(job)
  };
};

export const applyToJob = async (jobId, user) => {
  ensureAuthenticatedUser(user);

  const existingJob = await prisma.job.findUnique({
    where: {
      id: jobId
    }
  });

  if (!existingJob) {
    throw createHttpError(404, 'Job not found.');
  }

  if (existingJob.createdById === user.id) {
    throw createHttpError(400, 'You cannot apply to a job you created.');
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_applicantId: {
        jobId,
        applicantId: user.id
      }
    }
  });

  if (existingApplication) {
    throw createHttpError(409, 'You have already applied to this job.');
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId,
      applicantId: user.id
    },
    include: {
      job: true,
      applicant: true
    }
  });

  return {
    message: 'Job application submitted successfully.',
    application: serializeApplication(application)
  };
};

export const listMyJobs = async (user) => {
  ensureAuthenticatedUser(user);

  const jobs = await prisma.job.findMany({
    where: {
      createdById: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      createdBy: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  return {
    message: 'Your jobs fetched successfully.',
    jobs: jobs.map(serializeJob)
  };
};
