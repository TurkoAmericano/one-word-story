import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <span>Having issues? Contact us at{' '}
          <a href="mailto:curtis.erhart@gmail.com">curtis.erhart@gmail.com</a>
        </span>
        <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
      </div>
    </footer>
  );
};

export default Footer;
