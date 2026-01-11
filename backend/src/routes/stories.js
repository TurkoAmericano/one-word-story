import express from 'express';
import {
  createStory,
  getStories,
  getStory,
  addWord,
  endStory,
  deleteStory,
} from '../controllers/storyController.js';
import { authenticate, requireEmailVerification } from '../middleware/auth.js';
import {
  validate,
  createStoryValidation,
  addWordValidation,
  uuidValidation,
} from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List all stories for current user
router.get('/', getStories);

// Create new story (requires email verification)
router.post(
  '/',
  requireEmailVerification,
  validate(createStoryValidation),
  createStory
);

// Get specific story
router.get('/:id', validate(uuidValidation), getStory);

// Add word to story
router.post(
  '/:id/words',
  validate([...uuidValidation, ...addWordValidation]),
  addWord
);

// End story
router.post('/:id/end', validate(uuidValidation), endStory);

// Delete story (creator only)
router.delete('/:id', validate(uuidValidation), deleteStory);

export default router;
