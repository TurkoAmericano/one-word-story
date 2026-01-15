import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export const createStory = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { title, initialWord } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Create story
    const storyResult = await client.query(
      `INSERT INTO stories (title, created_by)
       VALUES ($1, $2)
       RETURNING id, title, created_by, is_ended, created_at`,
      [title || null, userId]
    );

    const story = storyResult.rows[0];

    // Add creator as first participant (turn_order 0)
    await client.query(
      `INSERT INTO story_participants (story_id, user_id, turn_order)
       VALUES ($1, $2, 0)`,
      [story.id, userId]
    );

    // Add initial word if provided
    if (initialWord) {
      await client.query(
        `INSERT INTO story_words (story_id, user_id, word, word_position)
         VALUES ($1, $2, $3, 0)`,
        [story.id, userId, initialWord.trim()]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      story: {
        id: story.id,
        title: story.title,
        createdBy: story.created_by,
        isEnded: story.is_ended,
        createdAt: story.created_at,
        wordCount: initialWord ? 1 : 0,
        participantCount: 1,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getStories = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all stories where user is a participant
    const result = await pool.query(
      `SELECT
        s.id,
        s.title,
        s.is_ended,
        s.ended_at,
        s.created_at,
        s.created_by,
        creator.username as creator_username,
        COUNT(DISTINCT sw.id) as word_count,
        COUNT(DISTINCT sp.id) as participant_count,
        sp.turn_order as user_turn_order
       FROM stories s
       INNER JOIN story_participants sp ON s.id = sp.story_id AND sp.user_id = $1
       LEFT JOIN users creator ON s.created_by = creator.id
       LEFT JOIN story_words sw ON s.id = sw.story_id
       GROUP BY s.id, s.title, s.is_ended, s.ended_at, s.created_at, s.created_by,
                creator.username, sp.turn_order
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const stories = result.rows.map(row => {
      const wordCount = parseInt(row.word_count, 10);
      const participantCount = parseInt(row.participant_count, 10);
      const currentTurnOrder = wordCount % participantCount;
      const needsMoreParticipants = participantCount < 2 && wordCount > 0;

      return {
        id: row.id,
        title: row.title,
        isEnded: row.is_ended,
        endedAt: row.ended_at,
        createdAt: row.created_at,
        createdBy: {
          id: row.created_by,
          username: row.creator_username,
        },
        wordCount,
        participantCount,
        currentTurn: row.is_ended ? null : currentTurnOrder,
        isYourTurn: row.is_ended || needsMoreParticipants ? false : currentTurnOrder === row.user_turn_order,
        needsMoreParticipants,
      };
    });

    res.json({ stories });
  } catch (error) {
    next(error);
  }
};

export const getStory = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is a participant
    const participantCheck = await client.query(
      'SELECT turn_order FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new AppError('You are not a participant in this story', 403);
    }

    const userTurnOrder = participantCheck.rows[0].turn_order;

    // Get story details
    const storyResult = await client.query(
      `SELECT
        s.id,
        s.title,
        s.is_ended,
        s.ended_by,
        s.ended_at,
        s.created_at,
        s.created_by,
        creator.username as creator_username,
        ender.username as ender_username
       FROM stories s
       LEFT JOIN users creator ON s.created_by = creator.id
       LEFT JOIN users ender ON s.ended_by = ender.id
       WHERE s.id = $1`,
      [id]
    );

    if (storyResult.rows.length === 0) {
      throw new AppError('Story not found', 404);
    }

    const story = storyResult.rows[0];

    // Get all words in order
    const wordsResult = await client.query(
      `SELECT sw.id, sw.word, sw.word_position, sw.created_at,
              sw.user_id, u.username
       FROM story_words sw
       LEFT JOIN users u ON sw.user_id = u.id
       WHERE sw.story_id = $1
       ORDER BY sw.word_position ASC`,
      [id]
    );

    const words = wordsResult.rows.map(row => ({
      id: row.id,
      word: row.word,
      position: row.word_position,
      createdAt: row.created_at,
      addedBy: {
        id: row.user_id,
        username: row.username,
      },
    }));

    // Get all participants
    const participantsResult = await client.query(
      `SELECT sp.turn_order, sp.joined_at, u.id, u.username
       FROM story_participants sp
       INNER JOIN users u ON sp.user_id = u.id
       WHERE sp.story_id = $1
       ORDER BY sp.turn_order ASC`,
      [id]
    );

    const participants = participantsResult.rows.map(row => ({
      id: row.id,
      username: row.username,
      turnOrder: row.turn_order,
      joinedAt: row.joined_at,
    }));

    const wordCount = words.length;
    const participantCount = participants.length;
    const currentTurnOrder = story.is_ended ? null : wordCount % participantCount;
    const needsMoreParticipants = participantCount < 2 && wordCount > 0;

    res.json({
      story: {
        id: story.id,
        title: story.title,
        isEnded: story.is_ended,
        endedAt: story.ended_at,
        createdAt: story.created_at,
        createdBy: {
          id: story.created_by,
          username: story.creator_username,
        },
        endedBy: story.ended_by ? {
          id: story.ended_by,
          username: story.ender_username,
        } : null,
        words,
        participants,
        wordCount,
        participantCount,
        currentTurn: currentTurnOrder,
        isYourTurn: !story.is_ended && !needsMoreParticipants && currentTurnOrder === userTurnOrder,
        needsMoreParticipants,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

export const addWord = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { word } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get story and verify it's not ended
    const storyResult = await client.query(
      'SELECT id, is_ended FROM stories WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (storyResult.rows.length === 0) {
      throw new AppError('Story not found', 404);
    }

    if (storyResult.rows[0].is_ended) {
      throw new AppError('This story has ended', 400);
    }

    // Get user's turn order
    const participantResult = await client.query(
      'SELECT turn_order FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      throw new AppError('You are not a participant in this story', 403);
    }

    const userTurnOrder = participantResult.rows[0].turn_order;

    // Get word count and participant count
    const countResult = await client.query(
      `SELECT
        COUNT(DISTINCT sw.id) as word_count,
        COUNT(DISTINCT sp.id) as participant_count
       FROM stories s
       LEFT JOIN story_words sw ON s.id = sw.story_id
       LEFT JOIN story_participants sp ON s.id = sp.story_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    const { word_count, participant_count } = countResult.rows[0];
    const participantCountInt = parseInt(participant_count, 10);

    // Require at least 2 participants for collaborative storytelling
    if (participantCountInt < 2) {
      throw new AppError('Invite at least one other participant before continuing the story', 400);
    }

    const currentTurn = parseInt(word_count, 10) % participantCountInt;

    // Verify it's the user's turn
    if (currentTurn !== userTurnOrder) {
      throw new AppError('It is not your turn', 403);
    }

    // Add the word
    const wordResult = await client.query(
      `INSERT INTO story_words (story_id, user_id, word, word_position)
       VALUES ($1, $2, $3, $4)
       RETURNING id, word, word_position, created_at`,
      [id, userId, word.trim(), word_count]
    );

    await client.query('COMMIT');

    res.status(201).json({
      word: {
        id: wordResult.rows[0].id,
        word: wordResult.rows[0].word,
        position: wordResult.rows[0].word_position,
        createdAt: wordResult.rows[0].created_at,
        addedBy: {
          id: userId,
          username: req.user.username,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const endStory = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get story and verify it's not already ended
    const storyResult = await client.query(
      'SELECT id, is_ended FROM stories WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (storyResult.rows.length === 0) {
      throw new AppError('Story not found', 404);
    }

    if (storyResult.rows[0].is_ended) {
      throw new AppError('This story has already ended', 400);
    }

    // Get user's turn order
    const participantResult = await client.query(
      'SELECT turn_order FROM story_participants WHERE story_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantResult.rows.length === 0) {
      throw new AppError('You are not a participant in this story', 403);
    }

    const userTurnOrder = participantResult.rows[0].turn_order;

    // Get word count and participant count
    const countResult = await client.query(
      `SELECT
        COUNT(DISTINCT sw.id) as word_count,
        COUNT(DISTINCT sp.id) as participant_count
       FROM stories s
       LEFT JOIN story_words sw ON s.id = sw.story_id
       LEFT JOIN story_participants sp ON s.id = sp.story_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    const { word_count, participant_count } = countResult.rows[0];
    const currentTurn = parseInt(word_count, 10) % parseInt(participant_count, 10);

    // Verify it's the user's turn
    if (currentTurn !== userTurnOrder) {
      throw new AppError('You can only end the story on your turn', 403);
    }

    // End the story
    await client.query(
      `UPDATE stories
       SET is_ended = TRUE, ended_by = $1, ended_at = NOW()
       WHERE id = $2`,
      [userId, id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Story ended successfully',
      endedBy: {
        id: userId,
        username: req.user.username,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is the creator
    const result = await pool.query(
      'DELETE FROM stories WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Story not found or you are not the creator', 403);
    }

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
};
