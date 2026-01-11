import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message);

        // Update user in context
        if (response.data.user) {
          updateUser(response.data.user);
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, updateUser, navigate]);

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h1 className="auth-title">Email Verification</h1>

          {status === 'verifying' && (
            <div className="loading">Verifying your email...</div>
          )}

          {status === 'success' && (
            <div className="success" style={{ textAlign: 'center', fontSize: '16px' }}>
              {message}
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="error" style={{ textAlign: 'center', fontSize: '16px' }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
