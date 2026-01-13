import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getAllUsers, deleteUser, resendVerificationEmail } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin access
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/users - List all users
router.get('/users', getAllUsers);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', deleteUser);

// POST /api/admin/users/:id/resend-verification - Resend verification email
router.post('/users/:id/resend-verification', resendVerificationEmail);

export default router;
