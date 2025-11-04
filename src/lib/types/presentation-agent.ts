/**
 * Type definitions for Smart Presentation AI Agent
 * Handles multi-model fallback and professional PPTX generation
 */

// ═══════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface ModelLimits {
	rpm: number; // Requests per minute
	rpd: number; // Requests per day
	tpm: number; // Tokens per minute
	tpd: number; // Tokens per day
}

export interface ModelConfig {
	model: string;
	provider: 'groq' | 'gemini';
}

export type TaskType =
	| 'contentAnalysis'
	| 'layoutDesign'
	| 'logoAnalysis'
	| 'overflowDecision'
	| 'validation';

// ═══════════════════════════════════════════════════════════════
// USAGE TRACKING
// ═══════════════════════════════════════════════════════════════

export interface UsageStats {
	requestsThisMinute: number;
	requestsToday: number;
	tokensThisMinute: number;
	tokensToday: number;
	lastResetMinute: number;
	lastResetDay: number;
}

export interface UsageReport {
	model: string;
	provider: string;
	requests: {
		minute: string;
		day: string;
	};
	tokens: {
		minute: string;
		day: string;
	};
	availability: '✅' | '⏳' | '❌';
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ANALYSIS
// ═══════════════════════════════════════════════════════════════

export interface ContentElements {
	hasColors: boolean;
	colorCount: number;
	hasBullets: boolean;
	bulletCount: number;
	hasHeadings: number;
	hasImages: boolean;
	hasFonts: boolean;
	fontCount: number;
	hasIcons: boolean;
	iconCount: number;
	textLength: number;
	keyElements: string[];
}

export interface SlideAnalysis {
	index: number;
	step: string;
	contentType:
		| 'color_palette'
		| 'typography'
		| 'text_heavy'
		| 'list'
		| 'visual_grid'
		| 'iconography'
		| 'photography'
		| 'mixed';
	complexity: 'simple' | 'medium' | 'complex';
	elements: ContentElements;
	recommendedSlideType: string;
	estimatedSlides: number;
}

export interface BatchAnalysisResult {
	slides: SlideAnalysis[];
	totalSlides: number;
	averageComplexity: string;
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT DESIGN
// ═══════════════════════════════════════════════════════════════

export interface Position {
	x: number; // inches
	y: number; // inches
	w: number; // inches (width)
	h: number; // inches (height)
}

export interface TextStyle {
	fontSize: number;
	fontFamily?: string;
	bold?: boolean;
	italic?: boolean;
	color?: string;
	align?: 'left' | 'center' | 'right' | 'justify';
}

export interface LayoutRegion {
	type:
		| 'text'
		| 'image'
		| 'color_swatch'
		| 'typography_card'
		| 'icon'
		| 'shape'
		| 'background';
	role?: string;
	content?: string;
	binding?: 'title' | 'content' | 'logo' | 'page_number' | 'brand_name';
	position: Position;
	style?: TextStyle;
	metadata?: Record<string, any>;
}

export interface SlideLayout {
	index: number;
	slideType: string;
	regions: LayoutRegion[];
	background?: {
		type: 'color' | 'gradient' | 'image';
		value: string;
	};
}

export interface BatchLayoutResult {
	slides: SlideLayout[];
	totalSlides: number;
	averageRegionsPerSlide: number;
}

// ═══════════════════════════════════════════════════════════════
// LOGO ANALYSIS
// ═══════════════════════════════════════════════════════════════

export interface LogoPlacement {
	aspectRatio: number;
	positions: {
		cover?: Position;
		header?: Position;
		footer?: Position;
		content?: Position;
		closing?: Position;
	};
	showOnAllSlides: boolean;
	reasoning?: string;
}

// ═══════════════════════════════════════════════════════════════
// OVERFLOW HANDLING
// ═══════════════════════════════════════════════════════════════

export interface OverflowParams {
	content: string;
	textLength: number;
	boxWidth: number;
	boxHeight: number;
	currentFontSize: number;
	minFontSize: number;
}

export interface OverflowDecision {
	strategy: 'shrink_font' | 'split_columns' | 'create_continuation' | 'remove_whitespace';
	parameters: Record<string, any>;
	reasoning: string;
	willFit: boolean;
	newFontSize?: number;
	columnsNeeded?: number;
	continuationSlides?: number;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface QualityIssue {
	severity: 'critical' | 'warning' | 'info';
	type: string;
	description: string;
	element?: string;
	suggestion?: string;
}

export interface QualityReport {
	passed: boolean;
	score: number; // 0-100
	issues: QualityIssue[];
	suggestions: string[];
}

// ═══════════════════════════════════════════════════════════════
// INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════

export interface StepData {
	step: string;
	title: string;
	content: string;
	approved: boolean;
}

export interface LogoFile {
	filename: string;
	fileData: string; // Base64 data URL
	usageTag: string;
}

export interface BrandData {
	brandName?: string;
	brandDomain?: string;
	shortDescription?: string;
	stepHistory?: StepData[];
	logoFiles?: LogoFile[];
	website?: string;
	contactEmail?: string;
	contactPhone?: string;
	brandColors?: string[];
	primaryFont?: string;
	secondaryFont?: string;
}

export interface GenerationResult {
	success: boolean;
	buffer?: Buffer;
	error?: string;
	stats?: {
		slidesGenerated: number;
		modelsUsed: string[];
		totalTime: number;
		totalTokens: number;
	};
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════

export interface AIResponse {
	content: string;
	tokensUsed: number;
	model: string;
	provider: string;
}

export interface ModelCallResult {
	success: boolean;
	data?: any;
	error?: string;
	tokensUsed: number;
	model: string;
	provider: string;
	attemptNumber: number;
}

