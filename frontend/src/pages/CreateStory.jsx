import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyAPI, invitationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/create-story.css';

const CreateStory = () => {
  const [title, setTitle] = useState('');
  const [initialWord, setInitialWord] = useState('');
  const [emails, setEmails] = useState(['']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user?.emailVerified) {
      setError('Please verify your email before creating stories');
      return;
    }

    setLoading(true);

    try {
      // Create story
      const storyResponse = await storyAPI.createStory({
        title: title.trim() || undefined,
        initialWord: initialWord.trim() || undefined,
      });

      const storyId = storyResponse.data.story.id;

      // Send invitations if any emails provided
      const validEmails = emails.filter((email) => email.trim() !== '');

      if (validEmails.length > 0) {
        try {
          await invitationAPI.createInvitations({
            storyId,
            emails: validEmails,
          });
        } catch (inviteError) {
          console.error('Failed to send invitations:', inviteError);
          // Don't fail the whole operation if invitations fail
        }
      }

      navigate(`/story/${storyId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-story-page">
      <div className="container">
        <div className="create-story-card">
          <h1>Create a New Story</h1>

          {!user?.emailVerified && (
            <div className="verification-notice">
              <p>You need to verify your email before creating stories.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-story-form">
            <div className="form-group">
              <label htmlFor="title">Story Title (Optional)</label>
              <input
                type="text"
                id="title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your story"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="initialWord">First Word (Optional)</label>
              <input
                type="text"
                id="initialWord"
                className="input"
                value={initialWord}
                onChange={(e) => setInitialWord(e.target.value)}
                placeholder="Start the story with a word"
                maxLength={50}
                pattern="[a-zA-Z'-]+"
                title="Only letters, hyphens, and apostrophes allowed"
              />
              <small className="input-hint">
                You can start the story, or leave it blank and let participants begin
              </small>
            </div>

            <div className="form-group">
              <label>Invite Participants (Optional)</label>
              <p className="input-hint">
                Invite friends via email. They'll receive an invitation link.
              </p>

              <div className="email-list">
                {emails.map((email, index) => (
                  <div key={index} className="email-input-row">
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="friend@example.com"
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(index)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddEmail}
                className="btn btn-outline btn-sm"
              >
                + Add Another Email
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !user?.emailVerified}
              >
                {loading ? 'Creating...' : 'Create Story'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
