import React from 'react';
import '../styles/privacy-policy.css';

const PrivacyPolicy = () => {
  const lastUpdated = 'January 24, 2026';
  const contactEmail = 'curtis.erhart@gmail.com';
  const siteName = 'One Word Story';

  return (
    <div className="privacy-policy">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>

        <section>
          <h2>Introduction</h2>
          <p>
            Welcome to {siteName}. We respect your privacy and are committed to protecting
            your personal data. This privacy policy explains how we collect, use, and
            safeguard your information when you use our collaborative story-writing platform.
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          <h3>Account Information</h3>
          <p>When you register for an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Username</li>
            <li>Password (stored securely using encryption)</li>
          </ul>

          <h3>User Content</h3>
          <p>When you use our service, we collect:</p>
          <ul>
            <li>Story contributions (words you add to stories)</li>
            <li>Stories you create</li>
            <li>Invitations you send to other users</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>We automatically collect certain information when you visit our site:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent</li>
            <li>Device information</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Create and manage your account</li>
            <li>Enable collaborative story creation with other users</li>
            <li>Send you notifications about story activity and invitations</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Improve our service and user experience</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2>Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to maintain your login session
            and remember your preferences. We also use cookies for analytics and advertising purposes.
          </p>
          <h3>Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the site to function properly</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
            <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
          </ul>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <h3>Google AdSense</h3>
          <p>
            We use Google AdSense to display advertisements on our site. Google AdSense may use
            cookies and web beacons to collect information about your visits to this and other
            websites to provide targeted advertisements. You can learn more about Google's
            privacy practices at{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google's Privacy Policy
            </a>.
          </p>
          <p>
            You can opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>.
          </p>
        </section>

        <section>
          <h2>Data Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>Other users you collaborate with (username and story contributions only)</li>
            <li>Service providers who assist in operating our platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information,
            including encryption, secure servers, and regular security assessments. However,
            no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2>Data Retention</h2>
          <p>
            We retain your account information and story contributions for as long as your
            account is active. You can request deletion of your account and associated data
            by contacting us.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13 years of age. We do not
            knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our data practices,
            please contact us at{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
