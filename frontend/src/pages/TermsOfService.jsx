import React from 'react';
import '../styles/terms-of-service.css';

const TermsOfService = () => {
  const lastUpdated = 'January 24, 2026';
  const contactEmail = 'curtis.erhart@gmail.com';
  const siteName = 'One Word Story';

  return (
    <div className="terms-of-service">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using {siteName}, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            {siteName} is a collaborative story-writing platform where users take turns
            contributing one word at a time to create stories together. The service allows
            users to create stories, invite participants, and collaborate in real-time.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>To use {siteName}, you must:</p>
          <ul>
            <li>Be at least 13 years of age</li>
            <li>Register with a valid email address</li>
            <li>Provide accurate account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p>
            You are responsible for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2>4. User Content</h2>
          <h3>Your Contributions</h3>
          <p>
            When you contribute words to stories on {siteName}, you retain ownership of your
            individual contributions. However, by submitting content, you grant us a worldwide,
            non-exclusive, royalty-free license to use, display, and distribute your contributions
            as part of the collaborative stories.
          </p>

          <h3>Content Standards</h3>
          <p>You agree not to submit content that:</p>
          <ul>
            <li>Is illegal, harmful, threatening, abusive, or harassing</li>
            <li>Is defamatory, vulgar, obscene, or offensive</li>
            <li>Infringes on intellectual property rights of others</li>
            <li>Contains spam, advertising, or promotional material</li>
            <li>Impersonates any person or entity</li>
            <li>Contains malicious code or attempts to compromise security</li>
          </ul>
        </section>

        <section>
          <h2>5. Acceptable Use</h2>
          <p>You agree to use {siteName} only for lawful purposes. You must not:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Use automated systems to access the service without permission</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Create multiple accounts to circumvent restrictions</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            The {siteName} platform, including its design, features, and functionality, is owned
            by us and protected by copyright and other intellectual property laws. You may not
            copy, modify, or distribute any part of the platform without our written permission.
          </p>
          <p>
            Collaborative stories created on the platform are jointly owned by all contributing
            participants.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without
            cause, and with or without notice. Reasons for termination may include:
          </p>
          <ul>
            <li>Violation of these Terms of Service</li>
            <li>Abusive or harmful behavior toward other users</li>
            <li>Extended periods of inactivity</li>
            <li>Request by you to delete your account</li>
          </ul>
        </section>

        <section>
          <h2>8. Disclaimers</h2>
          <p>
            {siteName} is provided "as is" and "as available" without warranties of any kind,
            either express or implied. We do not guarantee that the service will be uninterrupted,
            secure, or error-free.
          </p>
          <p>
            We are not responsible for any content created by users. User-generated stories may
            contain inappropriate or offensive material, and we make no guarantees about the
            quality or appropriateness of such content.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {siteName} and its operators shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages
            arising from your use of the service.
          </p>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless {siteName} and its operators from any claims,
            damages, or expenses arising from your use of the service or violation of these terms.
          </p>
        </section>

        <section>
          <h2>11. Changes to Terms</h2>
          <p>
            We may modify these Terms of Service at any time. We will notify users of significant
            changes by posting a notice on the site or sending an email. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the
            laws of the United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
