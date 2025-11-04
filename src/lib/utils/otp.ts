import { db } from '$lib/db';
import { user, verificationToken } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTransport } from 'nodemailer';
import { config } from 'dotenv';

// Load environment variables
config();

// Generate a 6-digit OTP
export function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
console.log('Email config check:', {
	host: process.env.EMAIL_SERVER_HOST,
	user: process.env.EMAIL_SERVER_USER,
	password: process.env.EMAIL_SERVER_PASSWORD ? 'SET' : 'NOT SET'
});

const transporter =
	process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER
		? createTransport({
				host: process.env.EMAIL_SERVER_HOST,
				port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
				secure: false,
				auth: {
					user: process.env.EMAIL_SERVER_USER,
					pass: process.env.EMAIL_SERVER_PASSWORD
				}
			})
		: null;

// Send OTP email
export async function sendOTPEmail(email: string, name: string, otp: string) {
	// Always log the OTP for development
	console.log(`OTP for ${email} (${name}): ${otp}`);

	// If email is not configured, just log the OTP
	if (!transporter) {
		console.log(`Email not configured. OTP for ${email}: ${otp}`);
		return true;
	}

	try {
		const mailOptions = {
			from: process.env.EMAIL_FROM || 'noreply@eternabrand.com',
			to: email,
			subject: 'Your EternaBrand Verification Code',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2563eb;">Welcome to EternaBrand!</h2>
					<p>Hi ${name},</p>
					<p>Thank you for signing up for EternaBrand. Please use the following verification code to complete your registration:</p>
					<div style="text-align: center; margin: 30px 0;">
						<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
							<h1 style="color: #2563eb; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
						</div>
					</div>
					<p>Enter this 6-digit code in the verification page to complete your registration.</p>
					<p><strong>This code will expire in 10 minutes.</strong></p>
					<p>If you didn't create an account with EternaBrand, please ignore this email.</p>
					<p>Best regards,<br>The EternaBrand Team</p>
				</div>
			`
		};

		await transporter.sendMail(mailOptions);
		console.log(`OTP email sent successfully to ${email}`);
		return true;
	} catch (error) {
		console.error('Error sending OTP email:', error);
		// Still return true since we logged the OTP
		return true;
	}
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
	try {
		// Find the verification token for this email and OTP
		const [tokenRecord] = await db
			.select()
			.from(verificationToken)
			.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, otp)));

		if (!tokenRecord || tokenRecord.expires < new Date()) {
			return false;
		}

		// Mark email as verified in user table
		await db
			.update(user)
			.set({
				emailVerified: new Date()
			})
			.where(eq(user.email, email));

		// Delete the used verification token
		await db
			.delete(verificationToken)
			.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, otp)));

		return true;
	} catch (error) {
		console.error('Error verifying OTP:', error);
		return false;
	}
}

// Store OTP in verification_token table
export async function storeOTP(email: string, otp: string) {
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

	try {
		// Delete any existing verification tokens for this email
		await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

		// Insert new verification token
		await db.insert(verificationToken).values({
			identifier: email,
			token: otp,
			expires: expiresAt
		});
	} catch (error) {
		console.error('Error storing OTP:', error);
		throw error;
	}
}
