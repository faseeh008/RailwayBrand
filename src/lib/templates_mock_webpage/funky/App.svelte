<script lang="ts">
	import HeroSection from './HeroSection.svelte';
	import CollectionGrid from './CollectionGrid.svelte';
	import CategoryShowcase from './CategoryShowcase.svelte';
	import FeaturedVideo from './FeaturedVideo.svelte';
	import Newsletter from './Newsletter.svelte';
	import Footer from './Footer.svelte';
	import { Shirt, Package, Sparkles, Star } from 'lucide-svelte';
	
	export let brandData: any;
	export let images: {
		hero: string | null;
		gallery: string[];
	};
	export let content: Record<string, any>;
	
	$: brandName = brandData?.brand_name || brandData?.brandName || 'FUNKIFY';
	$: primaryColor = brandData?.colorPalette?.[0] || '#9333ea';
	$: secondaryColor = brandData?.colorPalette?.[1] || '#ec4899';
	$: heroImage = images?.hero || '';
	$: galleryImages = images?.gallery || [];
	$: footerDescription =
		content?.footerDescription ||
		brandData?.short_description ||
		brandData?.description ||
		'Bold. Funky. Fearless. Express yourself with fashion that speaks your language.';
	$: collections = content?.collections || galleryImages.slice(0, 3).map((url: string, i: number) => ({
		title: ['Premium Suits', 'Traditional Elegance', 'Street Style'][i] || 'Collection',
		description: ['Executive Power', 'Shalwar Kameez', 'Urban Collection'][i] || 'Featured',
		image: url,
		color: ['#3b82f6', '#ec4899', '#f97316'][i] || primaryColor
	}));
	$: categories = content?.categories || [
		{ icon: Shirt, title: 'Designer Shirts', count: '150+ Styles', color: primaryColor },
		{ icon: Package, title: 'Complete Collections', count: '50+ Sets', color: secondaryColor },
		{ icon: Sparkles, title: 'Limited Edition', count: '25+ Pieces', color: '#fbbf24' },
		{ icon: Star, title: 'Best Sellers', count: '100+ Items', color: '#f97316' }
	];
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
	<HeroSection
		{heroImage}
		heroTitle={content?.heroTitle || 'BOLD. FUNKY. FEARLESS.'}
		heroDescription={content?.heroDescription || 'Express yourself with fashion that speaks your language. Bold designs, vibrant colors, and fearless style.'}
		heroBadge={content?.heroBadge || 'New Collection 2024'}
		ctaPrimary={content?.ctaPrimary || 'Shop Now'}
		ctaSecondary={content?.ctaSecondary || 'Explore'}
		{primaryColor}
		{secondaryColor}
	/>
	<CollectionGrid
		{collections}
		sectionTitle={content?.collectionsTitle || 'Featured'}
		sectionSubtitle={content?.collectionsSubtitle || 'Collections'}
		sectionDescription={content?.collectionsDescription || 'Curated styles for every occasion. From boardrooms to celebrations, we\'ve got you covered.'}
		{primaryColor}
		{secondaryColor}
	/>
	<CategoryShowcase
		{categories}
		showcaseImages={galleryImages.slice(0, 2)}
		sectionTitle={content?.categoriesTitle || 'Explore Our'}
		sectionSubtitle={content?.categoriesSubtitle || 'Categories'}
		sectionDescription={content?.categoriesDescription || 'From casual to formal, traditional to modern - find your perfect style match.'}
		{primaryColor}
		{secondaryColor}
	/>
	<FeaturedVideo
		sectionTitle={content?.videoTitle || 'Behind The'}
		sectionSubtitle={content?.videoSubtitle || 'Scenes'}
		sectionDescription={content?.videoDescription || 'Watch our latest fashion show and see how we bring funky fashion to life'}
		{primaryColor}
		{secondaryColor}
	/>
	<Newsletter
		sectionTitle={content?.newsletterTitle || 'Get 20% Off Your First Order! 🎉'}
		sectionDescription={content?.newsletterDescription || 'Join our funky fashion community and be the first to know about new collections, exclusive deals, and style tips.'}
		{primaryColor}
		{secondaryColor}
	/>
	<Footer {brandName} brandDescription={footerDescription} {primaryColor} {secondaryColor} />
</div>


