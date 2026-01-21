import React from 'react';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <span>Having issues? Contact us at{' '}
          <a href="mailto:curtis.erhart@gmail.com">curtis.erhart@gmail.com</a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
