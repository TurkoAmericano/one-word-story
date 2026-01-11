import { body, param, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => err.msg);
    next(new AppError(errorMessages.join(', '), 400));
  };
};

// Word validation rules
export const validateWord = (word) => {
  if (!word || typeof word !== 'string') {
    return false;
  }

  const trimmed = word.trim();

  // Must be 1-50 characters
  if (trimmed.length < 1 || trimmed.length > 50) {
    return false;
  }

  // Only letters, hyphens, and apostrophes allowed
  const wordPattern = /^[a-zA-Z'-]+$/;
  return wordPattern.test(trimmed);
};

// Validation chains
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const createStoryValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be 200 characters or less'),
  body('initialWord')
    .optional()
    .custom(value => {
      if (value && !validateWord(value)) {
        throw new Error('Initial word must be 1-50 letters (hyphens and apostrophes allowed)');
      }
      return true;
    }),
];

export const addWordValidation = [
  body('word')
    .custom(value => {
      if (!validateWord(value)) {
        throw new Error('Word must be 1-50 letters (hyphens and apostrophes allowed)');
      }
      return true;
    }),
];

export const inviteValidation = [
  body('emails')
    .isArray({ min: 1 })
    .withMessage('At least one email is required'),
  body('emails.*')
    .isEmail()
    .normalizeEmail()
    .withMessage('All emails must be valid'),
];

export const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];
