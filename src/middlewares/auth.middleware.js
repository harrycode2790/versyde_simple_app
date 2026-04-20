import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const requireAuth = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    const error = new Error('Authorization token is required.');
    error.statusCode = 401;
    return next(error);
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch {
    const error = new Error('Invalid or expired token.');
    error.statusCode = 401;
    next(error);
  }
};
