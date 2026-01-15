import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/story-card.css';

const StoryCard = ({ story }) => {
  const getStatusBadge = () => {
    if (story.isEnded) {
      return <span className="badge badge-success">Completed</span>;
    }
    if (story.needsMoreParticipants) {
      return <span className="badge badge-waiting">Waiting for participants</span>;
    }
    if (story.isYourTurn) {
      return <span className="badge badge-warning">Your Turn!</span>;
    }
    return <span className="badge badge-info">In Progress</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link to={`/story/${story.id}`} className="story-card-link">
      <div className="story-card">
        <div className="story-card-header">
          <h3 className="story-title">
            {story.title || 'Untitled Story'}
          </h3>
          {getStatusBadge()}
        </div>

        <div className="story-meta">
          <span className="story-info">
            {story.wordCount} {story.wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className="story-divider">•</span>
          <span className="story-info">
            {story.participantCount} {story.participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>

        <div className="story-footer">
          <span className="story-creator">
            Created by {story.createdBy.username}
          </span>
          <span className="story-date">
            {formatDate(story.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default StoryCard;
