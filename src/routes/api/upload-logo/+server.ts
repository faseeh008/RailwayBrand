import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('logo') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return json({ error: 'File size must be less than 5MB' }, { status: 400 });
		}

		// Convert file to base64
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const base64Data = buffer.toString('base64');
		const mimeType = file.type;
		
		// Create data URL format
		const dataUrl = `data:${mimeType};base64,${base64Data}`;

		return json({
			success: true,
			filename: file.name,
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
