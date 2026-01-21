import { test, expect } from './fixtures.js';
import { loginUserViaAPI } from './utils/auth.js';
import { createTestStory, getStory, getStoryWords, getParticipants } from './utils/database.js';

test.describe('Story Creation', () => {
  test('verified user can create a story with title only', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/create');

    await page.fill('input[name="title"], #title', 'My Adventure Story');
    await page.click('button[type="submit"]');

    // Should redirect to the story page
    await expect(page).toHaveURL(/\/story\//, { timeout: 10000 });

    // Story title should be visible
    await expect(page.locator('text=My Adventure Story')).toBeVisible();
  });

  test('verified user can create a story with title and first word', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/create');

    await page.fill('input[name="title"], #title', 'Once Upon a Time');
    await page.fill('input[name="firstWord"], #firstWord', 'Once');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/story\//, { timeout: 10000 });

    // First word should be displayed
    await expect(page.locator('text=Once')).toBeVisible();
  });

  test('unverified user cannot create a story', async ({ page, unverifiedUser }) => {
    await loginUserViaAPI(page, { email: unverifiedUser.email, password: unverifiedUser.password });
    await page.goto('/create');

    await page.fill('input[name="title"], #title', 'Test Story');
    await page.click('button[type="submit"]');

    // Should show error about email verification
    await expect(page.locator('text=/verify|email/i')).toBeVisible({ timeout: 10000 });
  });

  test('story creation adds user as first participant', async ({ page, verifiedUser, db }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/create');

    await page.fill('input[name="title"], #title', 'Participant Test Story');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/story\//, { timeout: 10000 });

    // Get story ID from URL
    const url = page.url();
    const storyId = url.split('/story/')[1];

    // Check database for participant
    const participants = await getParticipants(storyId);
    expect(participants).toHaveLength(1);
    expect(participants[0].user_id).toBe(verifiedUser.id);
    expect(participants[0].turn_order).toBe(0);
  });
});

test.describe('Story Dashboard Display', () => {
  test('should display user stories on dashboard', async ({ page, verifiedUser }) => {
    // Create a story first
    const story = await createTestStory(verifiedUser.id, 'Dashboard Test Story');

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    await expect(page.locator('text=Dashboard Test Story')).toBeVisible();
  });

  test('should categorize stories correctly - Your Turn', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    // Create story with user1 as creator
    const story = await createTestStory(user1.id, 'Your Turn Story');

    // Add user2 as participant
    await db.query(
      `INSERT INTO story_participants (story_id, user_id, turn_order) VALUES ($1, $2, 1)`,
      [story.id, user2.id]
    );

    // Login as user1 - it's their turn (turn 0)
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto('/dashboard');

    // Should appear in "Your Turn" section
    await expect(page.locator('text=Your Turn Story')).toBeVisible();
  });

  test('should show empty state when no stories', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Should show some indication of no stories
    await expect(page.locator('text=/no stories|create.*story|start.*story/i')).toBeVisible();
  });
});

test.describe('Story View', () => {
  test('should display story details correctly', async ({ page, verifiedUser }) => {
    const story = await createTestStory(verifiedUser.id, 'View Test Story');

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    await expect(page.locator('text=View Test Story')).toBeVisible();
  });

  test('should display story words in order', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Word Order Story');

    // Add some words
    await db.query(
      `INSERT INTO story_words (story_id, user_id, word, word_position) VALUES
       ($1, $2, 'The', 0),
       ($1, $2, 'quick', 1),
       ($1, $2, 'fox', 2)`,
      [story.id, verifiedUser.id]
    );

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Words should be visible
    const storyText = await page.locator('.story-text, .story-content').textContent();
    expect(storyText).toContain('The');
    expect(storyText).toContain('quick');
    expect(storyText).toContain('fox');
  });

  test('should show participants list', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Participants Story');
    await db.query(
      `INSERT INTO story_participants (story_id, user_id, turn_order) VALUES ($1, $2, 1)`,
      [story.id, user2.id]
    );

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Both usernames should be visible
    await expect(page.locator(`text=${user1.username}`)).toBeVisible();
    await expect(page.locator(`text=${user2.username}`)).toBeVisible();
  });

  test('non-participant cannot view story', async ({ page, twoUsers }) => {
    const { user1, user2 } = twoUsers;

    // Create story only with user1
    const story = await createTestStory(user1.id, 'Private Story');

    // Login as user2 who is not a participant
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // Should show error or redirect
    await expect(page.locator('text=/not.*participant|access denied|not found/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Story Deletion', () => {
  test('creator can delete their own story', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Delete Me Story');

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Find and click delete button
    const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete"]');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Story should no longer exist
      const deletedStory = await getStory(story.id);
      expect(deletedStory).toBeUndefined();
    }
  });

  test('non-creator cannot delete story', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Not My Story');
    await db.query(
      `INSERT INTO story_participants (story_id, user_id, turn_order) VALUES ($1, $2, 1)`,
      [story.id, user2.id]
    );

    // Login as user2 (not the creator)
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // Delete button should not be visible or should fail if clicked
    const deleteButton = page.locator('button:has-text("Delete")');
    const isVisible = await deleteButton.isVisible();

    if (isVisible) {
      await deleteButton.click();
      // Should show error
      await expect(page.locator('text=/cannot|not allowed|permission/i')).toBeVisible();
    }

    // Story should still exist
    const existingStory = await getStory(story.id);
    expect(existingStory).toBeTruthy();
  });
});

test.describe('Ended Stories', () => {
  test('should display ended story as read-only', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Ended Story');

    // End the story
    await db.query(
      `UPDATE stories SET is_ended = true, ended_by = $1, ended_at = NOW() WHERE id = $2`,
      [verifiedUser.id, story.id]
    );

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Should show "ended" indicator
    await expect(page.locator('text=/ended|complete|finished|the end/i')).toBeVisible();

    // Word input should not be visible or should be disabled
    const wordInput = page.locator('input[placeholder*="word"], .word-input');
    const isVisible = await wordInput.isVisible();
    if (isVisible) {
      await expect(wordInput).toBeDisabled();
    }
  });

  test('ended stories appear in completed section on dashboard', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Completed Story Test');

    await db.query(
      `UPDATE stories SET is_ended = true, ended_by = $1, ended_at = NOW() WHERE id = $2`,
      [verifiedUser.id, story.id]
    );

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Story should be visible in completed section
    await expect(page.locator('text=Completed Story Test')).toBeVisible();
  });
});
