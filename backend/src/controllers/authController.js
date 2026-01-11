import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, generateRandomToken } from '../utils/tokenUtils.js';
import { sendVerificationEmail } from '../services/emailService.js';

export const register = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateRandomToken();

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, username, password_hash, verification_token)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, email_verified, created_at`,
      [email, username, passwordHash, verificationToken]
    );

    const user = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      'SELECT id, email, username, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const result = await pool.query(
      `UPDATE users
       SET email_verified = TRUE, verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, email, username, email_verified`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const user = result.rows[0];

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        emailVerified: req.user.email_verified,
      },
    });
  } catch (error) {
    next(error);
  }
};
