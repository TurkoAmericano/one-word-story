import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateRandomToken } from '../utils/tokenUtils.js';
import { sendInvitationEmail } from '../services/emailService.js';

export const createInvitations = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { storyId, emails } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Verify story exists and user is a participant
    const storyResult = await client.query(
      `SELECT s.id, s.title, s.is_ended, sp.user_id
       FROM stories s
       INNER JOIN story_participants sp ON s.id = sp.story_id AND sp.user_id = $1
       WHERE s.id = $2`,
      [userId, storyId]
    );

    if (storyResult.rows.length === 0) {
      throw new AppError('Story not found or you are not a participant', 403);
    }

    const story = storyResult.rows[0];

    if (story.is_ended) {
      throw new AppError('Cannot invite to an ended story', 400);
    }

    // Get existing participants
    const existingParticipants = await client.query(
      `SELECT u.email
       FROM story_participants sp
       INNER JOIN users u ON sp.user_id = u.id
       WHERE sp.story_id = $1`,
      [storyId]
    );

    const existingEmails = new Set(existingParticipants.rows.map(p => p.email));

    // Get pending invitations
    const pendingInvitations = await client.query(
      `SELECT email FROM invitations
       WHERE story_id = $1 AND accepted = FALSE AND expires_at > NOW()`,
      [storyId]
    );

    const pendingEmails = new Set(pendingInvitations.rows.map(i => i.email));

    const invitations = [];
    const errors = [];

    for (const email of emails) {
      // Skip if already a participant
      if (existingEmails.has(email)) {
        errors.push({ email, reason: 'Already a participant' });
        continue;
      }

      // Skip if already has pending invitation
      if (pendingEmails.has(email)) {
        errors.push({ email, reason: 'Invitation already sent' });
        continue;
      }

      // Create invitation
      const token = generateRandomToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitationResult = await client.query(
        `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, token, created_at, expires_at`,
        [storyId, email, userId, token, expiresAt]
      );

      const invitation = invitationResult.rows[0];

      // Send invitation email
      try {
        await sendInvitationEmail(
          email,
          req.user.username,
          story.title,
          token
        );
        invitations.push({
          id: invitation.id,
          email: invitation.email,
          createdAt: invitation.created_at,
          expiresAt: invitation.expires_at,
        });
      } catch (emailError) {
        console.error(`Failed to send invitation to ${email}:`, emailError);
        errors.push({ email, reason: 'Failed to send email' });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${invitations.length} invitation(s) sent successfully`,
      invitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const acceptInvitation = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get invitation
    const invitationResult = await client.query(
      `SELECT i.id, i.story_id, i.email, i.accepted, i.expires_at, s.is_ended
       FROM invitations i
       INNER JOIN stories s ON i.story_id = s.id
       WHERE i.token = $1`,
      [token]
    );

    if (invitationResult.rows.length === 0) {
      throw new AppError('Invalid invitation token', 404);
    }

    const invitation = invitationResult.rows[0];

    // Check if already accepted
    if (invitation.accepted) {
      throw new AppError('Invitation already accepted', 400);
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    // Check if story is ended
    if (invitation.is_ended) {
      throw new AppError('This story has ended', 400);
    }

    // Verify email matches
    if (invitation.email !== req.user.email) {
      throw new AppError('This invitation was sent to a different email address', 403);
    }

    // Check if already a participant
    const participantCheck = await client.query(
      'SELECT id FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [invitation.story_id, userId]
    );

    if (participantCheck.rows.length > 0) {
      throw new AppError('You are already a participant in this story', 400);
    }

    // Get next turn order
    const turnOrderResult = await client.query(
      'SELECT COALESCE(MAX(turn_order), -1) + 1 as next_turn FROM story_participants WHERE story_id = $1',
      [invitation.story_id]
    );

    const nextTurn = turnOrderResult.rows[0].next_turn;

    // Add user as participant
    await client.query(
      `INSERT INTO story_participants (story_id, user_id, turn_order)
       VALUES ($1, $2, $3)`,
      [invitation.story_id, userId, nextTurn]
    );

    // Mark invitation as accepted
    await client.query(
      'UPDATE invitations SET accepted = TRUE WHERE id = $1',
      [invitation.id]
    );

    // Get story details
    const storyResult = await client.query(
      'SELECT id, title FROM stories WHERE id = $1',
      [invitation.story_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Successfully joined the story',
      story: {
        id: storyResult.rows[0].id,
        title: storyResult.rows[0].title,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is a participant
    const participantCheck = await pool.query(
      'SELECT id FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new AppError('You are not a participant in this story', 403);
    }

    // Get all participants
    const result = await pool.query(
      `SELECT sp.turn_order, sp.joined_at, u.id, u.username, u.email
       FROM story_participants sp
       INNER JOIN users u ON sp.user_id = u.id
       WHERE sp.story_id = $1
       ORDER BY sp.turn_order ASC`,
      [id]
    );

    const participants = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      turnOrder: row.turn_order,
      joinedAt: row.joined_at,
    }));

    res.json({ participants });
  } catch (error) {
    next(error);
  }
};

export const getPendingInvitations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is a participant
    const participantCheck = await pool.query(
      'SELECT id FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new AppError('You are not a participant in this story', 403);
    }

    // Get pending invitations
    const result = await pool.query(
      `SELECT i.id, i.email, i.created_at, i.expires_at, u.username as invited_by_username
       FROM invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.story_id = $1 AND i.accepted = FALSE AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [id]
    );

    const invitations = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      invitedBy: row.invited_by_username,
    }));

    res.json({ invitations });
  } catch (error) {
    next(error);
  }
};
