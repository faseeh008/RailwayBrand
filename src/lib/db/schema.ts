import { pgTable, text, timestamp, primaryKey, integer, boolean, serial, varchar, jsonb, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Auth.js compatible user table
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name'),
	email: text('email').notNull().unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image'),
	role: text('role').default('user'),
	isActive: boolean('isActive').default(true),
	hashedPassword: text('hashedPassword'),
	disabled: boolean('disabled').default(false)
});

// Auth.js compatible account table for OAuth providers
export const account = pgTable(
	'account',
	{
		userId: text('userId')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: text('type').$type<'oauth' | 'oidc' | 'email'>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => ({
		compoundKey: primaryKey(account.provider, account.providerAccountId)
	})
);

// Auth.js compatible session table
export const session = pgTable('session', {
	sessionToken: text('sessionToken').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

// Auth.js compatible verification token table
export const verificationToken = pgTable(
	'verification_token',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(vt) => ({
		compoundKey: primaryKey(vt.identifier, vt.token)
	})
);

// Brand guidelines table
export const brandGuidelines = pgTable('brand_guidelines', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	brandName: text('brandName').notNull(),
	content: text('content').notNull(),
	brandValues: text('brandValues'),
	industry: text('industry'),
	mood: text('mood'),
	audience: text('audience'),
	customPrompt: text('customPrompt'),
	logoPath: text('logoPath'),
	logoData: text('logoData'), // Base64 encoded logo image data
	// New structured data fields
	brandDomain: text('brandDomain'),
	shortDescription: text('shortDescription'),
	structuredData: text('structuredData'), // JSON string of BrandGuidelinesSpec
	logoFiles: text('logoFiles'), // JSON string of logo file metadata with base64 data
	colors: text('colors'), // JSON string of color data
	typography: text('typography'), // JSON string of typography data
	contactInfo: text('contactInfo'), // JSON string of contact data
	exportFiles: text('exportFiles'), // JSON string of export file metadata
	powerpointContent: text('powerpointContent'), // Base64 encoded PowerPoint content
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.notNull()
		.$defaultFn(() => new Date())
});

// PDFs Brand Guidelines table (for audit functionality)
export const pdfsBrandGuidelines = pgTable('pdfs_brand_guidelines', {
	id: serial('id').primaryKey(),
	brandName: varchar('brand_name', { length: 255 }).notNull().unique(),
	companyName: varchar('company_name', { length: 255 }),
	industry: varchar('industry', { length: 100 }),
	
	// Colors stored as JSONB for flexibility
	colors: jsonb('colors').$type<{
		semantic?: {
			primary?: { hex: string; rgb: string; name: string; usage: string };
			secondary?: { hex: string; rgb: string; name: string; usage: string };
			success?: { hex: string; rgb: string; name: string; usage: string };
			warning?: { hex: string; rgb: string; name: string; usage: string };
			danger?: { hex: string; rgb: string; name: string; usage: string };
		};
		neutral?: {
			white?: { hex: string; rgb: string; name: string; usage: string };
			gray100?: { hex: string; rgb: string; name: string; usage: string };
			gray200?: { hex: string; rgb: string; name: string; usage: string };
			gray300?: { hex: string; rgb: string; name: string; usage: string };
			gray500?: { hex: string; rgb: string; name: string; usage: string };
			gray900?: { hex: string; rgb: string; name: string; usage: string };
		};
		forbidden?: string[];
		accessibility?: {
			minContrastTextOnBackground?: number;
			minContrastUiElement?: number;
			colorBlindFriendly?: boolean;
		};
		allowedCombinations?: Array<{
			background: string;
			text: string;
			contrast: number;
		}>;
		rules?: string[];
	}>(),
	
	// Typography
	typography: jsonb('typography').$type<{
		fonts?: {
			primary?: string;
			fallback?: string;
			monospace?: string;
		};
		hierarchy?: {
			h1?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			h2?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			h3?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			h4?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			body?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			small?: { size: string; weight: number; lineHeight: string; letterSpacing: string; color: string; usage: string };
			code?: { size: string; weight: number; lineHeight: string; letterSpacing: string; fontFamily: string; color: string; usage: string };
		};
		responsive?: {
			breakpoints?: { sm: string; md: string; lg: string; xl: string };
			scaleFactors?: { small: number; medium: number; large: number };
		};
		rules?: string[];
	}>(),
	
	// Logo guidelines
	logo: jsonb('logo').$type<{
		variants?: {
			mark?: string;
			wordmark?: string;
			inverted?: string;
		};
		minWidth?: string;
		maxWidth?: string;
		clearSpace?: string;
		aspectRatio?: number;
		backgroundUsage?: {
			onDark?: string;
			onLight?: string;
		};
		forbidden?: string[];
		rules?: string[];
	}>(),
	
	// UI Components
	ui: jsonb('ui').$type<{
		buttons?: {
			primary?: { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string; fontWeight: string; usage: string };
			secondary?: { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string; fontWeight: string; usage: string };
			success?: { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string; fontWeight: string; usage: string };
			danger?: { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string; fontWeight: string; usage: string };
			ghost?: { bg: string; text: string; border: string; radius: string; padding: string; fontSize: string; fontWeight: string; usage: string };
		};
		states?: {
			hover?: { darkenFactor: number; transition: string };
			active?: { darkenFactor: number; transform: string };
			disabled?: { opacity: number; cursor: string };
			focus?: { outline: string; outlineOffset: string };
		};
		rules?: string[];
	}>(),
	
	// Spacing & Layout
	spacing: jsonb('spacing').$type<{
		base?: number;
		multiples?: number[];
		container?: { padding: number };
		sectionVertical?: number;
		elementGap?: number;
		responsive?: {
			sm?: { container: number; sectionVertical: number };
			md?: { container: number; sectionVertical: number };
			lg?: { container: number; sectionVertical: number };
		};
		rules?: string[];
	}>(),
	
	// Layout patterns
	layout: jsonb('layout').$type<{
		maxWidth?: number;
		gutters?: { sm: number; md: number; lg: number };
		columns?: number;
		breakpoints?: { xs: number; sm: number; md: number; lg: number; xl: number };
		alignment?: { default: string; center: boolean };
		grid?: {
			containerPadding: number;
			columnGap: number;
			rowGap: number;
		};
		rules?: string[];
	}>(),
	
	// Imagery & Iconography
	imagery: jsonb('imagery').$type<{
		iconStyle?: {
			strokeWidth: number;
			fill: string;
			color: string;
			cornerRadius: number;
		};
		illustrationStyle?: {
			palette: string[];
			filter: string;
			overlayOpacity: number;
			lineWeight: number;
		};
		photography?: {
			allowed: string[];
			forbidden: string[];
			filters: string[];
		};
		rules?: string[];
	}>(),
	
	// Tone of Voice & Content
	tone: jsonb('tone').$type<{
		style?: string;
		keywords?: string[];
		forbidden?: string[];
		writingStyle?: {
			voice: string;
			tense: string;
			person: string;
			punctuation: string;
			sentenceLength: string;
		};
		examples?: {
			good: string[];
			bad: string[];
		};
		rules?: string[];
	}>(),
	
	// Accessibility
	accessibility: jsonb('accessibility').$type<{
		contrast?: {
			normalText: number;
			largeText: number;
			uiElements: number;
		};
		focus?: {
			outline: string;
			outlineOffset: string;
		};
		keyboard?: {
			tabOrder: string;
			skipLinks: boolean;
			escapeKey: string;
		};
		screenReader?: {
			altText: string;
			labels: string;
			headings: string;
		};
		rules?: string[];
	}>(),
	
	// Global Rules
	globalRules: jsonb('global_rules').$type<string[]>(),
	
	// Metadata
	metadata: jsonb('metadata').$type<{
		version?: string;
		lastUpdated?: string;
		sourceUrl?: string;
		brandGuidelineDoc?: string;
	}>(),
	
	sourceFile: varchar('source_file', { length: 255 }),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Generated slides table to store HTML content after slide generation
export const generatedSlides = pgTable('generated_slides', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	brandName: text('brandName').notNull(), // Human-readable brand name for easy identification
	brandGuidelinesId: text('brandGuidelinesId')
		.references(() => brandGuidelines.id, { onDelete: 'cascade' }),
	slideTitle: text('slideTitle').notNull(),
	slideNumber: integer('slideNumber').notNull(),
	htmlContent: text('htmlContent').notNull(), // The complete HTML code for the slide
	slideType: text('slideType').notNull(), // e.g., 'title', 'content', 'thank-you', etc.
	slideData: text('slideData'), // JSON string of slide-specific data (content, styling, etc.)
	thumbnailPath: text('thumbnailPath'), // Path to slide thumbnail image
	thumbnailData: text('thumbnailData'), // Base64 encoded thumbnail image
	generationSettings: text('generationSettings'), // JSON string of settings used for generation
	status: text('status').default('completed'), // 'generating', 'completed', 'failed'
	errorMessage: text('errorMessage'), // Error message if generation failed
	createdAt: timestamp('createdAt', { mode: 'date' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Analysis Results Table (from audit-brand2 branch)
export const analysisResults = pgTable('analysis_results', {
	id: serial('id').primaryKey(),
	brandGuidelineId: text('brand_guideline_id').references(() => brandGuidelines.id, { onDelete: 'cascade' }),
	websiteUrl: text('website_url').notNull(),
	websiteTitle: varchar('website_title', { length: 255 }),
	
	// Analysis data
	violations: jsonb('violations').$type<Array<{
		elementType: string;
		issueType: string;
		severity: 'critical' | 'high' | 'medium' | 'low';
		found: any;
		expected: any;
		suggestion: string;
		affectedElements: number;
		examples: Array<any>;
		location: string;
		impact?: string;
		priority?: string;
	}>>(),
	
	correctElements: jsonb('correct_elements').$type<Array<{
		category: string;
		element: string;
		status: string;
		details: string;
		confidence: string;
	}>>(),
	
	// Summary metrics
	score: integer('score'),
	totalViolations: integer('total_violations'),
	severityBreakdown: jsonb('severity_breakdown').$type<{
		critical: number;
		high: number;
		medium: number;
		low: number;
	}>(),
	
	// Additional analysis data
	issues: jsonb('issues').$type<Array<any>>(), // Full issues array from audit
	recommendations: jsonb('recommendations').$type<Array<any>>(), // Recommendations array
	categoryScores: jsonb('category_scores').$type<{
		colors?: number;
		typography?: number;
		logo?: number;
		layout?: number;
		spacing?: number;
	}>(),
	screenshot: text('screenshot'), // Screenshot path or base64
	annotatedScreenshot: text('annotated_screenshot'), // Annotated screenshot path or base64
	fixPrompt: text('fix_prompt'), // AI fix prompt text
	
	// Analysis metadata
	analysisType: varchar('analysis_type', { length: 50 }),
	processingTime: integer('processing_time'), // in milliseconds
	elementsAnalyzed: integer('elements_analyzed'),
	
	// Metadata
	createdAt: timestamp('created_at').defaultNow(),
});

// Scraped Webpage Data Table (from schema.js)
export const scrapedWebpages = pgTable('scraped_webpages', {
	id: serial('id').primaryKey(),
	url: varchar('url', { length: 1000 }).notNull(),
	domain: varchar('domain', { length: 255 }),
	
	// Brand association - using text to match brandGuidelines.id type
	brandId: text('brand_id').references(() => brandGuidelines.id, { onDelete: 'cascade' }),
	
	// Scraped data stored as JSONB for flexibility
	colors: jsonb('colors'),
	typography: jsonb('typography'),
	logo: jsonb('logo'),
	layout: jsonb('layout'),
	imagery: jsonb('imagery'),
	
	// Metadata
	metadata: jsonb('metadata'),
	
	// Analysis results
	complianceScore: real('compliance_score'), // 0-1 score
	issues: jsonb('issues'), // Array of compliance issues
	recommendations: jsonb('recommendations'), // Array of recommendations
	
	// Screenshot
	screenshot: text('screenshot'), // Base64 encoded screenshot
	
	// Status
	status: varchar('status', { length: 50 }).default('scraped'), // scraped, analyzed, completed
	isActive: boolean('is_active').default(true),
	
	// Timestamps
	scrapedAt: timestamp('scraped_at').defaultNow(),
	analyzedAt: timestamp('analyzed_at'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Compliance Issues Table (from schema.js)
export const complianceIssues = pgTable('compliance_issues', {
	id: serial('id').primaryKey(),
	webpageId: integer('webpage_id').notNull().references(() => scrapedWebpages.id, { onDelete: 'cascade' }),
	issueType: varchar('issue_type', { length: 100 }).notNull(), // color, typography, logo, layout
	severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical
	description: text('description').notNull(),
	element: text('element'), // CSS selector or element description
	expectedValue: text('expected_value'),
	actualValue: text('actual_value'),
	recommendation: text('recommendation'),
	
	// Status
	isResolved: boolean('is_resolved').default(false),
	resolvedAt: timestamp('resolved_at'),
	
	// Timestamps
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Sessions Table (from schema.js)
export const auditSessions = pgTable('audit_sessions', {
	id: serial('id').primaryKey(),
	brandId: text('brand_id').notNull().references(() => brandGuidelines.id, { onDelete: 'cascade' }),
	sessionName: varchar('session_name', { length: 255 }),
	description: text('description'),
	
	// Results
	totalWebpages: integer('total_webpages').default(0),
	compliantWebpages: integer('compliant_webpages').default(0),
	averageScore: real('average_score'),
	
	// Status
	status: varchar('status', { length: 50 }).default('active'), // active, completed, archived
	isActive: boolean('is_active').default(true),
	
	// Timestamps
	startedAt: timestamp('started_at').defaultNow(),
	completedAt: timestamp('completed_at'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const brandGuidelinesRelations = relations(brandGuidelines, ({ many, one }) => ({
	generatedSlides: many(generatedSlides),
	analyses: many(analysisResults),
	scrapedWebpages: many(scrapedWebpages),
	auditSessions: many(auditSessions),
	user: one(user, {
		fields: [brandGuidelines.userId],
		references: [user.id],
	}),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
	brandGuideline: one(brandGuidelines, {
		fields: [analysisResults.brandGuidelineId],
		references: [brandGuidelines.id],
	}),
}));

export const generatedSlidesRelations = relations(generatedSlides, ({ one }) => ({
	brandGuideline: one(brandGuidelines, {
		fields: [generatedSlides.brandGuidelinesId],
		references: [brandGuidelines.id],
	}),
	user: one(user, {
		fields: [generatedSlides.userId],
		references: [user.id],
	}),
}));

export const scrapedWebpagesRelations = relations(scrapedWebpages, ({ one, many }) => ({
	brandGuideline: one(brandGuidelines, {
		fields: [scrapedWebpages.brandId],
		references: [brandGuidelines.id],
	}),
	issues: many(complianceIssues),
}));

export const complianceIssuesRelations = relations(complianceIssues, ({ one }) => ({
	webpage: one(scrapedWebpages, {
		fields: [complianceIssues.webpageId],
		references: [scrapedWebpages.id],
	}),
}));

export const auditSessionsRelations = relations(auditSessions, ({ one, many }) => ({
	brandGuideline: one(brandGuidelines, {
		fields: [auditSessions.brandId],
		references: [brandGuidelines.id],
	}),
	webpages: many(scrapedWebpages),
}));

// Type exports
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type VerificationToken = typeof verificationToken.$inferSelect;
export type NewVerificationToken = typeof verificationToken.$inferInsert;
export type BrandGuidelines = typeof brandGuidelines.$inferSelect;
export type NewBrandGuidelines = typeof brandGuidelines.$inferInsert;
export type PdfsBrandGuidelines = typeof pdfsBrandGuidelines.$inferSelect;
export type NewPdfsBrandGuidelines = typeof pdfsBrandGuidelines.$inferInsert;
export type GeneratedSlides = typeof generatedSlides.$inferSelect;
export type NewGeneratedSlides = typeof generatedSlides.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;
export type ScrapedWebpage = typeof scrapedWebpages.$inferSelect;
export type NewScrapedWebpage = typeof scrapedWebpages.$inferInsert;
export type ComplianceIssue = typeof complianceIssues.$inferSelect;
export type NewComplianceIssue = typeof complianceIssues.$inferInsert;
export type AuditSession = typeof auditSessions.$inferSelect;
export type NewAuditSession = typeof auditSessions.$inferInsert;
