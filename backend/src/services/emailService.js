import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.auth || undefined,
    tls: {
      rejectUnauthorized: false, // For development with MailHog
    },
  });
};

export const sendVerificationEmail = async (email, username, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `${config.email.fromName} <${config.email.from}>`,
    to: email,
    subject: 'Verify your email - One Word Story',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to One Word Story, ${username}!</h2>
        <p>Thanks for signing up. Please verify your email address to start creating and joining stories.</p>
        <p>
          <a href="${verificationUrl}"
             style="background-color: #4CAF50; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendInvitationEmail = async (email, inviterUsername, storyTitle, token) => {
  const transporter = createTransporter();
  const invitationUrl = `${config.frontendUrl}/accept-invite/${token}`;

  const mailOptions = {
    from: `${config.email.fromName} <${config.email.from}>`,
    to: email,
    subject: `${inviterUsername} invited you to join a story!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to write a story!</h2>
        <p><strong>${inviterUsername}</strong> has invited you to collaborate on a One Word Story${storyTitle ? `: "${storyTitle}"` : ''}.</p>
        <p>In this game, players take turns adding one word at a time to create a collaborative story.
           It's creative, hilarious, and addictive!</p>
        <p>
          <a href="${invitationUrl}"
             style="background-color: #2196F3; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Join the Story
          </a>
        </p>
        <p>Or copy this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${invitationUrl}</p>
        <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
};
