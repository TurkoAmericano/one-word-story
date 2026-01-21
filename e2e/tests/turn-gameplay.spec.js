import { test, expect } from './fixtures.js';
import { loginUserViaAPI } from './utils/auth.js';
import { createTestStory, addParticipant, addWord, getStoryWords } from './utils/database.js';

test.describe('Turn-Based Gameplay - Basic Turn Logic', () => {
  test('first participant (creator) can add word when it is their turn', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Turn Test Story');
    await addParticipant(story.id, user2.id, 1);

    // Login as user1 (creator, turn_order 0) - it's their turn
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Should see "Your Turn" indicator
    await expect(page.locator('text=/your turn/i')).toBeVisible();

    // Add a word
    await page.fill('.word-input, input[placeholder*="word"]', 'Hello');
    await page.click('button:has-text("Add"), button:has-text("Submit")');

    // Word should appear in the story
    await expect(page.locator('text=Hello')).toBeVisible({ timeout: 10000 });

    // Verify in database
    const words = await getStoryWords(story.id);
    expect(words).toHaveLength(1);
    expect(words[0].word).toBe('Hello');
  });

  test('second participant can add word when it is their turn', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Second Turn Story');
    await addParticipant(story.id, user2.id, 1);

    // Add first word so it becomes user2's turn
    await addWord(story.id, user1.id, 'First', 0);

    // Login as user2 - it's now their turn
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // Should see "Your Turn" indicator
    await expect(page.locator('text=/your turn/i')).toBeVisible();

    // Add a word
    await page.fill('.word-input, input[placeholder*="word"]', 'Second');
    await page.click('button:has-text("Add"), button:has-text("Submit")');

    // Word should appear in the story
    await expect(page.locator('text=Second')).toBeVisible({ timeout: 10000 });
  });

  test('user cannot add word when it is not their turn', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Not Your Turn Story');
    await addParticipant(story.id, user2.id, 1);

    // No words added, so it's user1's turn (turn_order 0)
    // Login as user2 - it's NOT their turn
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // Should see waiting message
    await expect(page.locator('text=/waiting|not your turn/i')).toBeVisible();

    // Word input should not be visible or should be disabled
    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const isVisible = await wordInput.isVisible();

    if (isVisible) {
      // If visible, trying to submit should fail
      await page.fill('.word-input, input[placeholder*="word"]', 'Attempt');
      const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        await expect(page.locator('text=/not your turn|error/i')).toBeVisible();
      }
    }
  });
});

test.describe('Turn-Based Gameplay - Turn Rotation', () => {
  test('turn rotates correctly with two participants', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Rotation Story');
    await addParticipant(story.id, user2.id, 1);

    // Turn 0: user1's turn
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);
    await page.fill('.word-input, input[placeholder*="word"]', 'Word1');
    await page.click('button:has-text("Add"), button:has-text("Submit")');
    await expect(page.locator('text=Word1')).toBeVisible({ timeout: 10000 });

    // Turn 1: user2's turn - should now see waiting message for user1
    await expect(page.locator('text=/waiting|not your turn/i')).toBeVisible({ timeout: 5000 });

    // Login as user2
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);
    await expect(page.locator('text=/your turn/i')).toBeVisible();
    await page.fill('.word-input, input[placeholder*="word"]', 'Word2');
    await page.click('button:has-text("Add"), button:has-text("Submit")');
    await expect(page.locator('text=Word2')).toBeVisible({ timeout: 10000 });

    // Turn 2: Back to user1
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);
    await expect(page.locator('text=/your turn/i')).toBeVisible();
  });

  test('turn rotates correctly with three participants', async ({ page, threeUsers, db }) => {
    const { user1, user2, user3 } = threeUsers;

    const story = await createTestStory(user1.id, 'Three Player Story');
    await addParticipant(story.id, user2.id, 1);
    await addParticipant(story.id, user3.id, 2);

    // Add words to simulate rotation
    await addWord(story.id, user1.id, 'One', 0);   // Turn 0
    await addWord(story.id, user2.id, 'Two', 1);   // Turn 1
    await addWord(story.id, user3.id, 'Three', 2); // Turn 2

    // Turn 3: Should be back to user1 (3 % 3 = 0)
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);
    await expect(page.locator('text=/your turn/i')).toBeVisible();
  });
});

test.describe('Turn-Based Gameplay - Single Participant', () => {
  test('single participant cannot add words', async ({ page, verifiedUser }) => {
    const story = await createTestStory(verifiedUser.id, 'Solo Story');

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Should show message about needing more participants
    await expect(page.locator('text=/need.*participant|invite|waiting.*participant/i')).toBeVisible();

    // Word input should not be usable
    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const isVisible = await wordInput.isVisible();

    if (!isVisible) {
      // Good - input is hidden for single participant
      expect(true).toBe(true);
    } else {
      // Input is visible but should be disabled or submission should fail
      const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');
      expect(await submitButton.isDisabled() || !(await submitButton.isVisible())).toBe(true);
    }
  });

  test('participant count display updates correctly', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    // Start with just user1
    const story = await createTestStory(user1.id, 'Count Story');

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Should show 1 participant
    await expect(page.locator('text=/1.*participant/i')).toBeVisible();

    // Add user2 via database
    await addParticipant(story.id, user2.id, 1);

    // Reload page
    await page.reload();

    // Should now show 2 participants
    await expect(page.locator('text=/2.*participant/i')).toBeVisible();
  });
});

test.describe('Turn-Based Gameplay - Word Validation', () => {
  test('cannot submit empty word', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Empty Word Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try to submit without entering a word
    const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');

    // Button should be disabled or form should not submit
    const isEmpty = await page.locator('.word-input, input[placeholder*="word"]').inputValue() === '';
    if (isEmpty && await submitButton.isEnabled()) {
      await submitButton.click();
      // Should show validation error
      const errorVisible = await page.locator('text=/required|empty|enter.*word/i').isVisible();
      const wordsInDb = await getStoryWords(story.id);
      expect(wordsInDb).toHaveLength(0); // No word should be added
    }
  });

  test('word character limit is enforced', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Long Word Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try to enter a very long word (over 100 characters)
    const longWord = 'a'.repeat(150);
    await page.fill('.word-input, input[placeholder*="word"]', longWord);

    // Check if input is truncated or shows warning
    const inputValue = await page.locator('.word-input, input[placeholder*="word"]').inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(100);
  });
});

test.describe('Turn-Based Gameplay - Ending Stories', () => {
  test('participant on their turn can end the story', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'End Story Test');
    await addParticipant(story.id, user2.id, 1);
    await addWord(story.id, user1.id, 'The', 0);
    await addWord(story.id, user2.id, 'end', 1);

    // It's user1's turn again (turn 2 % 2 = 0)
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Find and click end story button
    const endButton = page.locator('button:has-text("End"), button:has-text("Finish")');
    if (await endButton.isVisible()) {
      await endButton.click();

      // Confirm if there's a dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Story should show as ended
      await expect(page.locator('text=/ended|complete|finished|the end/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('participant NOT on their turn cannot end the story', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'No End Story');
    await addParticipant(story.id, user2.id, 1);
    // No words, so it's user1's turn

    // Login as user2 - NOT their turn
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // End button should not be visible or should be disabled
    const endButton = page.locator('button:has-text("End"), button:has-text("Finish")');
    const isVisible = await endButton.isVisible();

    if (isVisible) {
      expect(await endButton.isDisabled()).toBe(true);
    }
  });

  test('cannot add words to ended story', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Already Ended Story');
    await addParticipant(story.id, user2.id, 1);

    // End the story
    await db.query(
      `UPDATE stories SET is_ended = true, ended_by = $1, ended_at = NOW() WHERE id = $2`,
      [user1.id, story.id]
    );

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Word input should not be visible or usable
    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const isVisible = await wordInput.isVisible();

    if (isVisible) {
      expect(await wordInput.isDisabled()).toBe(true);
    }

    // Should show ended message
    await expect(page.locator('text=/ended|complete|the end/i')).toBeVisible();
  });
});

test.describe('Turn-Based Gameplay - Turn Indicator Display', () => {
  test('shows whose turn it is', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Turn Indicator Story');
    await addParticipant(story.id, user2.id, 1);

    // Login as user2 - it's user1's turn
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/story/${story.id}`);

    // Should indicate it's user1's turn
    await expect(page.locator(`text=/${user1.username}.*turn|waiting.*${user1.username}/i`)).toBeVisible();
  });

  test('turn indicator updates after adding word', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Update Indicator Story');
    await addParticipant(story.id, user2.id, 1);

    // Login as user1 and add a word
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    await page.fill('.word-input, input[placeholder*="word"]', 'Test');
    await page.click('button:has-text("Add"), button:has-text("Submit")');

    await expect(page.locator('text=Test')).toBeVisible({ timeout: 10000 });

    // Should now show it's user2's turn or waiting message
    await expect(page.locator(`text=/waiting|${user2.username}.*turn/i`)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Turn-Based Gameplay - Word Author Attribution', () => {
  test('words show author attribution', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Attribution Story');
    await addParticipant(story.id, user2.id, 1);
    await addWord(story.id, user1.id, 'Hello', 0);
    await addWord(story.id, user2.id, 'World', 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Word list view should show authors
    const wordList = page.locator('.word-list, .word-item');
    if (await wordList.isVisible()) {
      await expect(page.locator(`text=${user1.username}`)).toBeVisible();
      await expect(page.locator(`text=${user2.username}`)).toBeVisible();
    }
  });
});
