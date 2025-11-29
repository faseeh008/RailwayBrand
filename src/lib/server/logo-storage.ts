// logoAssets table has been removed - logos are now stored in brandGuidelines table
// This function now converts buffer to base64 data URL for direct use

type SaveLogoAssetParams = {
	buffer: Buffer;
	filename: string;
	mimeType: string;
	userId?: string | null;
	source?: string | null;
};

export async function saveLogoAsset({
	buffer,
	filename,
	mimeType
}: SaveLogoAssetParams): Promise<{ id: string; fileUrl: string }> {
	// Convert buffer to base64 data URL instead of storing in database
	const base64 = buffer.toString('base64');
	const dataUrl = `data:${mimeType};base64,${base64}`;
	
	// Return a mock ID and the data URL
	// The dataUrl can be used directly without needing an ID
	return {
		id: `data-url-${Date.now()}`, // Mock ID for compatibility
		fileUrl: dataUrl
	};
}

export async function getLogoAssetById(
	id: string
): Promise<{ id: string; filename: string; mimeType: string; data: Buffer } | null> {
	// LogoAssets table no longer exists - return null for backward compatibility
	console.warn('getLogoAssetById called but logoAssets table has been removed');
	return null;
}

export function getLogoUrlFromId(id?: string | null): string | null {
	if (!id) return null;
	return buildLogoUrl(id);
}

