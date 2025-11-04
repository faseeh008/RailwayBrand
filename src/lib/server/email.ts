import { createTransport } from 'nodemailer';
import { env } from '../env';

export async function sendOtpEmail(to: string, code: string) {
	// Log that email was sent but don't show the code for security
	if (env.NODE_ENV !== 'production') {
		console.log(`[email][dev] Sending OTP to ${to}`);
	}

	// Use the centralized environment variables
	const host = env.EMAIL_SERVER_HOST;
	const port = env.EMAIL_SERVER_PORT;
	const user = env.EMAIL_SERVER_USER;
	const pass = env.EMAIL_SERVER_PASSWORD;
	const from = env.EMAIL_FROM;

	console.log('[email] SMTP Configuration check:', {
		host: host ? 'SET' : 'NOT SET',
		port: port ? 'SET' : 'NOT SET',
		user: user ? 'SET' : 'NOT SET',
		pass: pass ? 'SET' : 'NOT SET'
	});

	if (!host || !port || !user || !pass) {
		console.warn('[email] SMTP not configured. Email cannot be sent.');
		console.warn('[email] Missing config:', {
			host: !!host,
			port: !!port,
			user: !!user,
			pass: !!pass
		});
		console.warn('[email] Please configure SMTP settings to send verification emails.');
		return;
	}

	const transporter = createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
		tls: {
			rejectUnauthorized: false
		}
	});

	const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Your verification code</h2>
      <p>Enter the following 6-digit code to verify your email address:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

	try {
		console.log(`[email] Sending verification email to: ${to}`);
		console.log(`[email] Using SMTP: ${host}:${port}`);

		const result = await transporter.sendMail({
			to,
			from,
			subject: 'Your verification code - EternaBrand',
			html
		});

		console.log(`[email] Email sent successfully:`, result.messageId);
	} catch (error) {
		console.error('[email] Failed to send email:', error);
		throw error;
	}
}
