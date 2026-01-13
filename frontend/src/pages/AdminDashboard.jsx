import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import '../styles/admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This will also delete all their stories and contributions.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setSuccessMessage(`User "${username}" deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendVerification = async (userId, email) => {
    try {
      setActionLoading(userId);
      await adminAPI.resendVerification(userId);
      setSuccessMessage(`Verification email sent to ${email}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users and system settings</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="admin-section">
          <div className="section-header">
            <h2>Users</h2>
            <span className="user-count">{users.length} total</span>
          </div>

          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.email === user.email ? 'current-user' : ''}>
                    <td className="username-cell">
                      {u.username}
                      {u.email === user.email && <span className="you-badge">You</span>}
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td className="verified-cell">
                      {u.email_verified ? (
                        <span className="badge badge-success">Verified</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(u.created_at)}</td>
                    <td className="actions-cell">
                      {u.email !== user.email && (
                        <>
                          {!u.email_verified && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleResendVerification(u.id, u.email)}
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? 'Sending...' : 'Resend Email'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
