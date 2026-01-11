import express from 'express';
import { register, login, verifyEmail, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, registerValidation, loginValidation } from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/verify/:token', verifyEmail);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
