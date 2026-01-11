import React from 'react';
import '../styles/story-board.css';

const StoryBoard = ({ story }) => {
  if (!story || !story.words) {
    return null;
  }

  const storyText = story.words.map((w) => w.word).join(' ');

  return (
    <div className="story-board">
      <div className="story-header">
        <h2>{story.title || 'Untitled Story'}</h2>
        {story.isEnded && (
          <span className="badge badge-success">Completed</span>
        )}
      </div>

      {story.words.length > 0 ? (
        <div className="story-content">
          <p className="story-text">{storyText}</p>

          <div className="word-list">
            {story.words.map((word, index) => (
              <div key={word.id} className="word-item">
                <span className="word-number">{index + 1}.</span>
                <span className="word-text">{word.word}</span>
                <span className="word-author">by {word.addedBy.username}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="story-empty">
          <p>This story hasn't started yet. Be the first to add a word!</p>
        </div>
      )}

      {story.endedBy && (
        <div className="story-ended-notice">
          Story ended by {story.endedBy.username}
        </div>
      )}
    </div>
  );
};

export default StoryBoard;
