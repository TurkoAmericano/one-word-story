import React, { useState } from 'react';
import '../styles/word-input.css';

const WordInput = ({ onAddWord, onEndStory, isYourTurn, isEnded, canEnd, participantCount }) => {
  const [word, setWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateWord = (text) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 'Word cannot be empty';
    if (trimmed.length > 50) return 'Word must be 50 characters or less';
    if (!/^[a-zA-Z'-]+$/.test(trimmed)) {
      return 'Word can only contain letters, hyphens, and apostrophes';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateWord(word);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await onAddWord(word.trim());
      setWord('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add word');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm('Are you sure you want to end this story?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onEndStory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end story');
    } finally {
      setLoading(false);
    }
  };

  if (isEnded) {
    return (
      <div className="word-input-card">
        <div className="story-ended-message">
          This story has been completed. No more words can be added.
        </div>
      </div>
    );
  }

  // Check if waiting for more participants
  if (participantCount < 2) {
    return (
      <div className="word-input-card">
        <div className="waiting-message">
          <p style={{ marginBottom: '12px', fontSize: '16px' }}>
            Waiting for participants to join...
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            You need at least one other participant to continue the story. Use the "Invite Participants" button above to send invitations.
          </p>
        </div>
      </div>
    );
  }

  if (!isYourTurn) {
    return (
      <div className="word-input-card">
        <div className="waiting-message">
          Waiting for other participants to add their words...
        </div>
      </div>
    );
  }

  return (
    <div className="word-input-card">
      <div className="your-turn-banner">
        It's your turn! Add a word to continue the story.
      </div>

      <form onSubmit={handleSubmit} className="word-input-form">
        <div className="word-input-group">
          <input
            type="text"
            className="input word-input"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter your word..."
            disabled={loading}
            autoFocus
            maxLength={50}
            pattern="[a-zA-Z'-]+"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !word.trim()}
          >
            {loading ? 'Adding...' : 'Add Word'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </form>

      {canEnd && (
        <div className="end-story-section">
          <p className="end-story-hint">
            Feel like the story is complete? You can end it on your turn.
          </p>
          <button
            onClick={handleEnd}
            className="btn btn-danger"
            disabled={loading}
          >
            End Story
          </button>
        </div>
      )}
    </div>
  );
};

export default WordInput;
