import pool from '../config/database.js';
import { AppError } from '../utils/errors.js';
import { generateRandomToken } from '../utils/tokenUtils.js';
import { sendVerificationEmail } from '../services/emailService.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, email_verified, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user.id) {
      return next(new AppError('Cannot delete your own account', 400));
    }

    // Delete user's related data first (cascade should handle this, but being explicit)
    await pool.query('DELETE FROM story_participants WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM words WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM invitations WHERE invited_by = $1', [id]);

    // Delete stories created by this user
    await pool.query('DELETE FROM stories WHERE created_by = $1', [id]);

    // Delete the user
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      message: 'User deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user
    const userResult = await pool.query(
      'SELECT id, username, email, email_verified FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return next(new AppError('User email is already verified', 400));
    }

    // Generate new verification token
    const verificationToken = generateRandomToken();

    // Update user with new token
    await pool.query(
      'UPDATE users SET verification_token = $1, updated_at = NOW() WHERE id = $2',
      [verificationToken, id]
    );

    // Send verification email
    await sendVerificationEmail(user.email, user.username, verificationToken);

    res.json({
      message: 'Verification email sent successfully',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};
