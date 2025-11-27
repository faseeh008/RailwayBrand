import { getLogoAssetById } from './logo-storage';

type LogoLike = {
	storageId?: string;
	assetId?: string;
	fileUrl?: string;
	fileData?: string;
	filePath?: string;
	filename?: string;
};

function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } | null {
	const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	if (!match) return null;
	const [, mimeType, base64] = match;
	return {
		buffer: Buffer.from(base64, 'base64'),
		mimeType
	};
}

export function extractLogoAssetId(logo: LogoLike | null | undefined): string | null {
	if (!logo) return null;
	if (logo.storageId) return logo.storageId;
	if (logo.assetId) return logo.assetId;

	const fileUrl = logo.fileUrl || logo.fileData;
	if (fileUrl && typeof fileUrl === 'string') {
		const match = fileUrl.match(/\/api\/logos\/([a-f0-9-]+)/i);
		if (match) {
			return match[1];
		}
	}

	return null;
}

export async function loadLogoBuffer(
	logo: LogoLike | null | undefined
): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
	if (!logo) return null;

	if (logo.fileData && typeof logo.fileData === 'string' && logo.fileData.startsWith('data:')) {
		const parsed = parseDataUrl(logo.fileData);
		if (!parsed) return null;
		return {
			buffer: parsed.buffer,
			mimeType: parsed.mimeType,
			filename: logo.filename || 'logo'
		};
	}

	const assetId = extractLogoAssetId(logo);
	if (assetId) {
		const asset = await getLogoAssetById(assetId);
		if (asset) {
			return {
				buffer: asset.data,
				mimeType: asset.mimeType,
				filename: asset.filename
			};
		}
	}

	const remoteUrl = logo.fileUrl || logo.filePath || logo.fileData;
	if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.startsWith('http')) {
		const response = await fetch(remoteUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch remote logo from ${remoteUrl}`);
		}
		const arrayBuffer = await response.arrayBuffer();
		return {
			buffer: Buffer.from(arrayBuffer),
			mimeType: response.headers.get('content-type') || 'image/png',
			filename: logo.filename || remoteUrl.split('/').pop() || 'logo'
		};
	}

	return null;
}

export async function getLogoDataUrl(
	logo: LogoLike | null | undefined
): Promise<string | null> {
	const asset = await loadLogoBuffer(logo);
	if (!asset) return null;
	const base64 = asset.buffer.toString('base64');
	return `data:${asset.mimeType};base64,${base64}`;
}

export function resolveLogoSrc(logo: LogoLike | null | undefined): string | null {
	if (!logo) return null;
	if (logo.fileUrl) return logo.fileUrl;
	if (logo.fileData && typeof logo.fileData === 'string') {
		return logo.fileData;
	}
	if (logo.filePath) return logo.filePath;
	return null;
}

