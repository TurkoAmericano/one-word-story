import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../services/api';

const AcceptInvite = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const [storyId, setStoryId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const response = await invitationAPI.acceptInvitation(token);
        setStatus('success');
        setMessage(response.data.message);
        setStoryId(response.data.story.id);

        // Redirect to story after 2 seconds
        setTimeout(() => {
          navigate(`/story/${response.data.story.id}`);
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Failed to accept invitation');
      }
    };

    acceptInvite();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h1 className="auth-title">Join Story</h1>

          {status === 'processing' && (
            <div className="loading">Processing invitation...</div>
          )}

          {status === 'success' && (
            <div className="success" style={{ textAlign: 'center', fontSize: '16px' }}>
              {message}
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
                Redirecting to story...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="error" style={{ textAlign: 'center', fontSize: '16px' }}>
                {message}
              </div>
              {message.includes('different email') && (
                <div style={{ textAlign: 'center', marginTop: '16px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                  <p style={{ color: '#856404', fontSize: '14px', marginBottom: '8px' }}>
                    This invitation was sent to a specific email address. Please log in with the correct account and try again.
                  </p>
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-outline"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                  }}
                  className="btn btn-primary"
                >
                  Log in as Different User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
