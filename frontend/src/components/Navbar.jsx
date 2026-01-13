import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/navbar.css';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAuthenticated && ADMIN_EMAIL && user?.email === ADMIN_EMAIL;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          One Word Story
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/create" className="nav-link">
                Create Story
              </Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link nav-admin">
                  Admin
                </Link>
              )}
              <div className="nav-user">
                <span className="nav-username">{user?.username}</span>
                {!user?.emailVerified && (
                  <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                    Unverified
                  </span>
                )}
              </div>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
