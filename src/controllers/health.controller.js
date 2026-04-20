export const getHealthStatus = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'versyde-backend'
  });
};
