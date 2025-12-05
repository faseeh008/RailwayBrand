/**
 * Lightweight message history manager for hybrid versioning approach
 * Tracks message versions without full tree structure
 */

export interface MessageVersion {
	id: string;
	messageId: string;
	content: any;
	type: 'step' | 'logo' | 'bot' | 'user';
	timestamp: string;
	isActive: boolean;
	parentVersionId?: string;
	metadata?: Record<string, any>;
}

export interface LogoVersion {
	id: string;
	logoData: string;
	filename: string;
	format: string;
	feedback?: string;
	createdAt: string;
	isAccepted: boolean;
	messageId: string;
}

/**
 * Add a new version to message history (instead of overwriting)
 */
export function addMessageVersion(
	history: MessageVersion[] | null | undefined,
	messageId: string,
	content: any,
	type: 'step' | 'logo' | 'bot' | 'user',
	metadata?: Record<string, any>
): MessageVersion[] {
	const versions = history || [];
	
	// Mark previous active version as inactive
	const updatedVersions = versions.map(v => 
		v.messageId === messageId && v.isActive 
			? { ...v, isActive: false }
			: v
	);
	
	// Add new version
	const newVersion: MessageVersion = {
		id: `${messageId}-v${versions.length + 1}-${Date.now()}`,
		messageId,
		content,
		type,
		timestamp: new Date().toISOString(),
		isActive: true,
		parentVersionId: versions.find(v => v.messageId === messageId && v.isActive)?.id,
		metadata
	};
	
	return [...updatedVersions, newVersion];
}

/**
 * Get active version of a message
 */
export function getActiveVersion(
	history: MessageVersion[] | null | undefined,
	messageId: string
): MessageVersion | null {
	if (!history) return null;
	return history.find(v => v.messageId === messageId && v.isActive) || null;
}

/**
 * Get all versions of a message
 */
export function getMessageVersions(
	history: MessageVersion[] | null | undefined,
	messageId: string
): MessageVersion[] {
	if (!history) return [];
	return history.filter(v => v.messageId === messageId).sort((a, b) => 
		new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);
}

/**
 * Switch to a specific version
 */
export function switchToVersion(
	history: MessageVersion[] | null | undefined,
	versionId: string
): MessageVersion[] | null {
	if (!history) return null;
	
	const targetVersion = history.find(v => v.id === versionId);
	if (!targetVersion) return history;
	
	// Mark all versions of this message as inactive, then activate target
	return history.map(v => {
		if (v.messageId === targetVersion.messageId) {
			return { ...v, isActive: v.id === versionId };
		}
		return v;
	});
}

/**
 * Add logo version to history
 */
export function addLogoVersion(
	logoHistory: LogoVersion[] | null | undefined,
	logoData: string,
	filename: string,
	format: string,
	messageId: string,
	feedback?: string
): LogoVersion[] {
	const history = logoHistory || [];
	
	// Mark previous accepted logos as not accepted
	const updated = history.map(v => ({ ...v, isAccepted: false }));
	
	const newVersion: LogoVersion = {
		id: `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		logoData,
		filename,
		format,
		feedback,
		createdAt: new Date().toISOString(),
		isAccepted: false,
		messageId
	};
	
	return [...updated, newVersion];
}

/**
 * Mark logo version as accepted
 */
export function acceptLogoVersion(
	logoHistory: LogoVersion[] | null | undefined,
	versionId: string
): LogoVersion[] | null {
	if (!logoHistory) return null;
	
	return logoHistory.map(v => ({
		...v,
		isAccepted: v.id === versionId
	}));
}

