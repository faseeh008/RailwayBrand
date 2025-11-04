import nodemailer from 'nodemailer';
import { db } from '$lib/db';
import { verificationToken } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Only create transporter if email is configured
const transporter =
	process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER
		? nodemailer.createTransport({
				host: process.env.EMAIL_SERVER_HOST,
				port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
				secure: false,
				auth: {
					user: process.env.EMAIL_SERVER_USER,
					pass: process.env.EMAIL_SERVER_PASSWORD
				}
			})
		: null;

export async function sendVerificationEmail(email: string, name: string) {
	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	// Store the verification token in the database
	await db.insert(verificationToken).values({
		identifier: email,
		token,
		expires
	});

	// If email is not configured, just log the verification URL
	if (!transporter) {
		const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:5173'}/auth/verify/${token}`;
		console.log(
			`Verification email would be sent to ${email}. Verification URL: ${verificationUrl}`
		);
		return;
	}

	const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:5173'}/auth/verify/${token}`;

	const mailOptions = {
		from: process.env.EMAIL_FROM || 'noreply@eternabrand.com',
		to: email,
		subject: 'Verify your EternaBrand account',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #2563eb;">Welcome to EternaBrand!</h2>
				<p>Hi ${name},</p>
				<p>Thank you for signing up for EternaBrand. Please click the button below to verify your email address:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${verificationUrl}" 
					   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						Verify Email Address
					</a>
				</div>
				<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">${verificationUrl}</p>
				<p>This link will expire in 24 hours.</p>
				<p>Best regards,<br>The EternaBrand Team</p>
			</div>
		`
	};

	await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string) {
	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	// Store the password reset token in the database
	await db.insert(verificationToken).values({
		identifier: `reset:${email}`,
		token,
		expires
	});

	// If email is not configured, just log the reset URL
	if (!transporter) {
		const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:5173'}/auth/reset-password?token=${token}`;
		console.log(`Password reset email would be sent to ${email}. Reset URL: ${resetUrl}`);
		return;
	}

	const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:5173'}/auth/reset-password?token=${token}`;

	const mailOptions = {
		from: process.env.EMAIL_FROM || 'noreply@eternabrand.com',
		to: email,
		subject: 'Reset your EternaBrand password',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #2563eb;">Password Reset Request</h2>
				<p>You requested to reset your password for your EternaBrand account.</p>
				<p>Click the button below to reset your password:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${resetUrl}" 
					   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						Reset Password
					</a>
				</div>
				<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
				<p style="word-break: break-all; color: #666;">${resetUrl}</p>
				<p>This link will expire in 24 hours.</p>
				<p>If you didn't request this password reset, please ignore this email.</p>
				<p>Best regards,<br>The EternaBrand Team</p>
			</div>
		`
	};

	await transporter.sendMail(mailOptions);
}

export async function verifyEmailToken(token: string): Promise<string | null> {
	const verificationTokenRecord = await db.query.verificationToken.findFirst({
		where: eq(verificationToken.token, token)
	});

	if (!verificationTokenRecord || verificationTokenRecord.expires < new Date()) {
		return null;
	}

	// Delete the used token
	await db.delete(verificationToken).where(eq(verificationToken.token, token));

	return verificationTokenRecord.identifier;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
	const resetToken = await db.query.verificationToken.findFirst({
		where: eq(verificationToken.token, token)
	});

	if (
		!resetToken ||
		resetToken.expires < new Date() ||
		!resetToken.identifier.startsWith('reset:')
	) {
		return null;
	}

	return resetToken.identifier.replace('reset:', '');
}

export async function markPasswordResetTokenAsUsed(token: string) {
	await db.delete(verificationToken).where(eq(verificationToken.token, token));
}
