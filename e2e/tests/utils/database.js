import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'one_word_story',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }
  return pool;
}

export async function cleanDatabase() {
  const db = getPool();
  // Delete in order of dependencies
  await db.query('DELETE FROM story_words');
  await db.query('DELETE FROM invitations');
  await db.query('DELETE FROM story_participants');
  await db.query('DELETE FROM stories');
  await db.query('DELETE FROM users');
}

export async function createTestUser({ email, username, password = 'password123', emailVerified = true }) {
  const db = getPool();
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (email, username, password_hash, email_verified)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, email_verified`,
    [email, username, passwordHash, emailVerified]
  );

  return result.rows[0];
}

export async function getUser(email) {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getVerificationToken(email) {
  const db = getPool();
  const result = await db.query(
    'SELECT verification_token FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0]?.verification_token;
}

export async function getInvitationToken(email, storyId) {
  const db = getPool();
  const result = await db.query(
    'SELECT token FROM invitations WHERE email = $1 AND story_id = $2',
    [email, storyId]
  );
  return result.rows[0]?.token;
}

export async function getStory(storyId) {
  const db = getPool();
  const result = await db.query('SELECT * FROM stories WHERE id = $1', [storyId]);
  return result.rows[0];
}

export async function getStoryWords(storyId) {
  const db = getPool();
  const result = await db.query(
    'SELECT * FROM story_words WHERE story_id = $1 ORDER BY word_position',
    [storyId]
  );
  return result.rows;
}

export async function getParticipants(storyId) {
  const db = getPool();
  const result = await db.query(
    'SELECT * FROM story_participants WHERE story_id = $1 ORDER BY turn_order',
    [storyId]
  );
  return result.rows;
}

export async function createTestStory(creatorId, title = 'Test Story') {
  const db = getPool();
  const storyResult = await db.query(
    `INSERT INTO stories (title, created_by)
     VALUES ($1, $2)
     RETURNING id, title, created_by`,
    [title, creatorId]
  );

  const story = storyResult.rows[0];

  // Add creator as first participant
  await db.query(
    `INSERT INTO story_participants (story_id, user_id, turn_order)
     VALUES ($1, $2, 0)`,
    [story.id, creatorId]
  );

  return story;
}

export async function addParticipant(storyId, userId, turnOrder) {
  const db = getPool();
  await db.query(
    `INSERT INTO story_participants (story_id, user_id, turn_order)
     VALUES ($1, $2, $3)`,
    [storyId, userId, turnOrder]
  );
}

export async function addWord(storyId, userId, word, position) {
  const db = getPool();
  await db.query(
    `INSERT INTO story_words (story_id, user_id, word, word_position)
     VALUES ($1, $2, $3, $4)`,
    [storyId, userId, word, position]
  );
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
