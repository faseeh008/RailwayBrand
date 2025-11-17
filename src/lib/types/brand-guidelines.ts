// Comprehensive Brand Guidelines JSON Schema
// This follows the exact specification from the system prompt

export interface BrandGuidelinesSpec {
	// Core Brand Information
	brand_name: string;
	brand_domain: string; // e.g., "SaaS", "Fintech", "Retail", "Healthcare"
	short_description: string;
	positioning_statement: string;
	vision: string;
	mission: string;
	values: string[];
	target_audience: string;
	differentiation: string;

	// Voice & Tone
	voice_and_tone: VoiceAndTone;

	// Brand Personality
	brand_personality: BrandPersonality;

	// Visual Identity
	logo: LogoSystem;
	colors: ColorSystem;
	typography: TypographySystem;
	iconography: IconographySystem;
	patterns_gradients: PatternGradient[];
	photography: PhotographyGuidelines;

	// Applications & Usage
	applications: ApplicationExample[];
	dos_and_donts: DosDontExample[];

	// Contact & Legal
	legal_contact: LegalContact;

	// Export Information
	export_files: ExportFiles;

	// Metadata
	missing_assets?: string[];
	slide_decisions?: Record<string, string>;
	created_at: string;
	version: string;
}

export interface VoiceAndTone {
	adjectives: string[];
	guidelines: string;
	sample_lines: string[];
}

export interface BrandPersonality {
	identity: string;
	language: string;
	voice: string;
	characteristics: string[];
	motivation: string;
	fear: string;
}

export interface LogoSystem {
	primary: string;
	variants: string[];
	color_versions: string[];
	clear_space_method: string;
	minimum_sizes: string[];
	correct_usage: string[];
	incorrect_usage: string[];
}

export interface ColorSystem {
	core_palette: ColorSwatch[];
	secondary_palette: ColorSwatch[];
}

export interface ColorSwatch {
	name: string;
	hex: string;
	rgb: string;
	cmyk: string;
	pantone?: string;
	usage: string;
	accessibility_rating: string;
}

export interface TypographySystem {
	primary: FontDefinition;
	supporting: FontDefinition;
	secondary: FontDefinition[];
}

export interface FontDefinition {
	name: string;
	weights: string[];
	usage: string;
	fallback_suggestions: string[];
	web_link?: string;
}

export interface IconographySystem {
	style: string;
	grid: string;
	stroke: string;
	color_usage: string;
	specific_icons: string[];
	notes: string;
}

export interface PatternGradient {
	name: string;
	colors: string[];
	usage: string;
}

export interface PhotographyGuidelines {
	mood: string[];
	guidelines: string;
	examples: string[];
}

export interface ApplicationExample {
	context: string;
	description: string;
	layout_notes: string[];
}

export interface DosDontExample {
	description: string;
	visual_reference?: string;
	reason?: string;
}

export interface LegalContact {
	contact_name: string;
	title: string;
	email: string;
	company: string;
	address: string;
	website: string;
}

export interface ExportFiles {
	pptx: string;
	assets_zip: string;
	json: string;
}

// Input types for the generator
export interface BrandGuidelinesInput {
	brand_name: string;
	brand_domain: string;
	short_description: string;
	// Brand positioning fields from builder form
	selectedMood?: string;
	selectedAudience?: string;
	brandValues?: string; // Brand values & mission statement (text)
	customPrompt?: string; // Custom brand description & requirements
	positioning_statement?: string;
	vision?: string;
	mission?: string;
	values?: string[];
	voice_and_tone?: {
		adjectives?: string[];
		guidelines?: string;
		sample_lines?: string[];
	};
	brand_personality?: {
		identity?: string;
		language?: string;
		voice?: string;
		characteristics?: string[];
		motivation?: string;
		fear?: string;
	};
	logo_files: LogoFileInput[];
	colors?: ColorInput[];
	typography?: TypographyInput;
	iconography?: {
		grid_size?: string;
		stroke_weight?: string;
		style?: string;
		sample_icons?: string[];
	};
	patterns_gradients?: {
		name?: string;
		colors?: string[];
		usage?: string;
	}[];
	photography?: {
		mood_adjectives?: string[];
		guidelines?: string;
		examples?: string[];
	};
	applications?: {
		context?: string;
		layout_notes?: string[];
	}[];
	dos_and_donts?: {
		description?: string;
		visual_reference?: string;
		reason?: string;
	}[];
	contact: ContactInput;
	export_files?: {
		pptx?: string;
		zip?: string;
		json?: string;
	};
}

export interface LogoFileInput {
	filename: string;
	usage_tag: 'primary' | 'icon' | 'lockup' | 'alternative';
	file_data: string; // Base64 encoded data URL
	file_size: number;
}

export interface ColorInput {
	hex: string;
	rgb?: string;
	cmyk?: string;
	pantone?: string;
	name?: string;
}

export interface TypographyInput {
	primary_font?: string;
	supporting_font?: string;
	secondary_font?: string;
	usage_rules?: string;
	sample_text?: string;
}

export interface ContactInput {
	name: string;
	email: string;
	role?: string;
	company?: string;
	address?: string;
	website?: string;
}

// Response types
export interface BrandGuidelinesResponse {
	success: boolean;
	brand_guidelines?: BrandGuidelinesSpec;
	powerpoint_url?: string;
	assets_zip_url?: string;
	error?: string;
}
