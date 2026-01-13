import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const requireAdmin = (req, res, next) => {
  if (!config.adminEmail) {
    return next(new AppError('Admin access not configured', 500));
  }

  if (req.user.email !== config.adminEmail) {
    return next(new AppError('Admin access required', 403));
  }

  next();
};
