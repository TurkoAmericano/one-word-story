import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storyAPI, invitationAPI } from '../services/api';
import StoryBoard from '../components/StoryBoard';
import WordInput from '../components/WordInput';
import '../styles/story-view.css';

const StoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmails, setInviteEmails] = useState(['']);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    loadStory();
    loadParticipants();
  }, [id]);

  const loadStory = async () => {
    try {
      const response = await storyAPI.getStory(id);
      setStory(response.data.story);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await invitationAPI.getParticipants(id);
      setParticipants(response.data.participants);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const handleAddWord = async (word) => {
    await storyAPI.addWord(id, word);
    await loadStory(); // Reload to get updated story
  };

  const handleEndStory = async () => {
    await storyAPI.endStory(id);
    await loadStory(); // Reload to get updated story
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
      return;
    }

    try {
      await storyAPI.deleteStory(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete story');
    }
  };

  const handleSendInvites = async (e) => {
    e.preventDefault();
    setInviteMessage('');
    setInviteLoading(true);

    const validEmails = inviteEmails.filter((email) => email.trim() !== '');

    if (validEmails.length === 0) {
      setInviteMessage('Please enter at least one email');
      setInviteLoading(false);
      return;
    }

    try {
      const response = await invitationAPI.createInvitations({
        storyId: id,
        emails: validEmails,
      });

      setInviteMessage(`${response.data.invitations.length} invitation(s) sent successfully!`);
      setInviteEmails(['']);
      setShowInviteForm(false);

      // Optionally reload participants
      setTimeout(() => {
        setInviteMessage('');
      }, 3000);
    } catch (err) {
      setInviteMessage(err.response?.data?.error || 'Failed to send invitations');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading story...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="error">{error}</div>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  const isCreator = story.createdBy.id === story.createdBy.id; // You'd need user context here

  return (
    <div className="story-view">
      <div className="container">
        <div className="story-actions">
          <Link to="/dashboard" className="btn btn-outline">
            ← Back to Dashboard
          </Link>
          <div className="action-buttons">
            {!story.isEnded && (
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="btn btn-secondary"
              >
                Invite Participants
              </button>
            )}
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Story
            </button>
          </div>
        </div>

        {inviteMessage && (
          <div className={inviteMessage.includes('success') ? 'success' : 'error'}>
            {inviteMessage}
          </div>
        )}

        {showInviteForm && (
          <div className="invite-form-card">
            <h3>Invite More Participants</h3>
            <form onSubmit={handleSendInvites}>
              <div className="email-list">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="email-input-row">
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...inviteEmails];
                        newEmails[index] = e.target.value;
                        setInviteEmails(newEmails);
                      }}
                      placeholder="friend@example.com"
                    />
                    {inviteEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInviteEmails(inviteEmails.filter((_, i) => i !== index));
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setInviteEmails([...inviteEmails, ''])}
                  className="btn btn-outline btn-sm"
                >
                  + Add Email
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </form>
          </div>
        )}

        <StoryBoard story={story} />

        <WordInput
          onAddWord={handleAddWord}
          onEndStory={handleEndStory}
          isYourTurn={story.isYourTurn}
          isEnded={story.isEnded}
          canEnd={story.wordCount > 0}
          participantCount={story.participantCount}
        />

        <div className="participants-card">
          <h3>Participants ({participants.length})</h3>
          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <div className="participant-info">
                  <span className="participant-name">{participant.username}</span>
                  <span className="participant-turn">Turn {participant.turnOrder + 1}</span>
                </div>
                {story.currentTurn === participant.turnOrder && !story.isEnded && (
                  <span className="badge badge-warning">Current Turn</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryView;
