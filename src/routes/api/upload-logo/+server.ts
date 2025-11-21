import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('logo') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return json({ error: 'File size must be less than 5MB' }, { status: 400 });
		}

		// Save file to filesystem
		const uploadsDir = join(process.cwd(), 'static', 'uploads', 'logos');
		
		// Create directory if it doesn't exist
		if (!existsSync(uploadsDir)) {
			await mkdir(uploadsDir, { recursive: true });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const filename = `${timestamp}-${sanitizedOriginalName}`;
		const filePath = join(uploadsDir, filename);

		// Write file to disk
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(filePath, buffer);

		// Convert file to base64 for data URL
		const base64Data = buffer.toString('base64');
		const mimeType = file.type || (file.name.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
		
		// Create data URL format
		const dataUrl = `data:${mimeType};base64,${base64Data}`;

		// Return both file path and base64 data
		return json({
			success: true,
			filename: filename,
			filePath: `/uploads/logos/${filename}`,
			fileData: dataUrl,
			fileSize: file.size,
			mimeType: mimeType,
			originalName: file.name
		});
	} catch (error) {
		console.error('Logo upload error:', error);
		return json({ error: 'Failed to upload logo' }, { status: 500 });
	}
};
