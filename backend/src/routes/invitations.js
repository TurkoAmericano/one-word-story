import express from 'express';
import {
  createInvitations,
  acceptInvitation,
  getParticipants,
  getPendingInvitations,
} from '../controllers/invitationController.js';
import { authenticate, requireEmailVerification } from '../middleware/auth.js';
import { validate, inviteValidation, uuidValidation } from '../utils/validators.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create invitations (requires email verification)
router.post(
  '/',
  requireEmailVerification,
  validate([
    body('storyId').isUUID().withMessage('Valid story ID is required'),
    ...inviteValidation,
  ]),
  createInvitations
);

// Accept invitation
router.get('/:token', acceptInvitation);

// Get participants for a story
router.get('/stories/:id/participants', validate(uuidValidation), getParticipants);

// Get pending invitations for a story
router.get('/stories/:id/pending', validate(uuidValidation), getPendingInvitations);

export default router;
