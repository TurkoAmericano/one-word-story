import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storyAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StoryCard from '../components/StoryCard';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await storyAPI.getStories();
      setStories(response.data.stories);
    } catch (err) {
      setError('Failed to load stories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeStories = stories.filter((s) => !s.isEnded);
  const completedStories = stories.filter((s) => s.isEnded);
  const yourTurnStories = stories.filter((s) => s.isYourTurn);

  if (loading) {
    return <div className="loading">Loading stories...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Your Stories</h1>
            {!user?.emailVerified && (
              <div className="verification-notice">
                <p>
                  Please check your email and verify your account to create stories and send
                  invitations.
                </p>
              </div>
            )}
          </div>
          <Link to="/create" className="btn btn-primary">
            Create New Story
          </Link>
        </div>

        {error && <div className="error">{error}</div>}

        {yourTurnStories.length > 0 && (
          <section className="stories-section">
            <h2 className="section-title">Your Turn</h2>
            <div className="stories-grid">
              {yourTurnStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {activeStories.length > 0 && (
          <section className="stories-section">
            <h2 className="section-title">
              Active Stories ({activeStories.length})
            </h2>
            <div className="stories-grid">
              {activeStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {completedStories.length > 0 && (
          <section className="stories-section">
            <h2 className="section-title">
              Completed Stories ({completedStories.length})
            </h2>
            <div className="stories-grid">
              {completedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {stories.length === 0 && (
          <div className="empty-state">
            <h2>No stories yet</h2>
            <p>Create your first story or wait for an invitation from friends!</p>
            <Link to="/create" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Create Your First Story
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
