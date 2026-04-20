export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    ...(isDevelopment && error.cause ? { cause: error.cause.message } : {})
  });
};
