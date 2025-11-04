// Mock data for brand guideline forms
// This file contains the original options that were used before

export const mockMoodOptions = [
	'Professional & Corporate',
	'Creative & Artistic',
	'Playful & Fun',
	'Minimalist & Clean',
	'Bold & Dynamic',
	'Elegant & Sophisticated',
	'Modern & Contemporary',
	'Traditional & Classic',
	'Friendly & Approachable',
	'Authoritative & Trustworthy',
	'Innovative & Cutting-edge',
	'Warm & Inviting',
	'Luxury & Premium',
	'Casual & Relaxed',
	'Tech-forward & Digital'
];

export const mockTargetAudiences = [
	'Young Professionals (25-35)',
	'Small Business Owners',
	'Enterprise Executives',
	'Creative Professionals',
	'Students & Young Adults',
	'Families with Children',
	'Seniors (55+)',
	'Tech Enthusiasts',
	'Health & Wellness Conscious',
	'Budget-Conscious Consumers',
	'Luxury & High-End Consumers',
	'Millennials (25-40)',
	'Gen Z (18-25)',
	'Working Parents',
	'Retirees & Empty Nesters',
	'Entrepreneurs & Startups',
	'Corporate Decision Makers',
	'Local Community Members',
	'Global Audience',
	'Industry Professionals'
];

// Mock creative data for the creative page
export const mockCreatives = [
	{
		id: 1,
		title: 'Product Launch Post',
		description: 'Eye-catching product announcement',
		platform: 'Instagram',
		format: 'Square',
		image: '/api/placeholder/400/400',
		text: 'Introducing our latest innovation! 🚀',
		hashtags: ['#innovation', '#launch', '#newproduct']
	},
	{
		id: 2,
		title: 'Brand Story',
		description: 'Behind-the-scenes brand narrative',
		platform: 'LinkedIn',
		format: 'Rectangle',
		image: '/api/placeholder/600/400',
		text: 'The story behind our mission...',
		hashtags: ['#brandstory', '#mission', '#values']
	},
	{
		id: 3,
		title: 'Customer Testimonial',
		description: 'Social proof and customer success',
		platform: 'Facebook',
		format: 'Rectangle',
		image: '/api/placeholder/600/400',
		text: 'Hear what our customers say! 💬',
		hashtags: ['#testimonial', '#customers', '#success']
	}
];

// Mock audit report data
export const mockAuditReport = {
	overallScore: 78,
	issues: [
		{
			type: 'color',
			severity: 'high',
			description: 'Inconsistent color usage across pages',
			location: 'Homepage, About page',
			recommendation: 'Establish a consistent color palette and apply it uniformly'
		},
		{
			type: 'typography',
			severity: 'medium',
			description: 'Multiple font families used without hierarchy',
			location: 'Product pages',
			recommendation: 'Define primary and secondary fonts with clear usage guidelines'
		},
		{
			type: 'logo',
			severity: 'low',
			description: 'Logo appears in different sizes without clear space guidelines',
			location: 'Header, footer',
			recommendation: 'Define minimum logo size and clear space requirements'
		}
	],
	suggestions: [
		'Create a comprehensive brand style guide',
		'Implement consistent spacing and layout patterns',
		'Establish clear visual hierarchy across all touchpoints',
		'Develop brand voice and tone guidelines',
		'Create templates for common content types'
	]
};
