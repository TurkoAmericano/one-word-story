import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/landing.css';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <div className="container">
        <div className="hero">
          <h1 className="hero-title">One Word Story</h1>
          <p className="hero-subtitle">
            Collaborate with friends to create hilarious and unpredictable stories,
            one word at a time.
          </p>

          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
                <Link to="/create" className="btn btn-outline btn-lg">
                  Create New Story
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <h3>Collaborative</h3>
            <p>Take turns with friends adding one word at a time to build a story together.</p>
          </div>
          <div className="feature-card">
            <h3>Creative</h3>
            <p>See where your imagination takes you. Every story is unique and unexpected.</p>
          </div>
          <div className="feature-card">
            <h3>Fun</h3>
            <p>Perfect for breaking the ice, entertaining friends, or just having a laugh.</p>
          </div>
        </div>

        <div className="how-it-works">
          <h2>How It Works</h2>
          <ol className="steps">
            <li>Create a new story and invite your friends via email</li>
            <li>Wait for your turn and add one word to the story</li>
            <li>Watch as the story unfolds with each contribution</li>
            <li>When someone feels it's complete, they can end the story</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Landing;
