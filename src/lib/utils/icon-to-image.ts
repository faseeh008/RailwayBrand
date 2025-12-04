/**
 * Icon Mapper Utility
 * Maps icon names to Lucide icon component names
 * Provides intelligent matching for common icon names
 */

// Common icon name mappings to Lucide icon names (only real icons that exist)
const iconNameMap: Record<string, string> = {
	// Common actions
	'add': 'Plus',
	'plus': 'Plus',
	'create': 'Plus',
	'new': 'Plus',
	'edit': 'Edit',
	'update': 'Edit',
	'modify': 'Edit',
	'delete': 'Trash',
	'remove': 'Trash',
	'save': 'Save',
	'cancel': 'X',
	'close': 'X',
	'check': 'Check',
	'checkmark': 'Check',
	'success': 'CheckCircle',
	'confirm': 'CheckCircle',
	'approve': 'CheckCircle',
	'deny': 'XCircle',
	'reject': 'XCircle',
	
	// Navigation
	'arrow': 'ArrowRight',
	'arrow-right': 'ArrowRight',
	'arrow-left': 'ArrowLeft',
	'arrow-up': 'ArrowUp',
	'arrow-down': 'ArrowDown',
	'next': 'ChevronRight',
	'previous': 'ChevronLeft',
	'back': 'ChevronLeft',
	'forward': 'ChevronRight',
	'up': 'ChevronUp',
	'down': 'ChevronDown',
	'navigation': 'Navigation',
	'menu': 'Menu',
	'search': 'Search',
	'filter': 'Filter',
	'sort': 'ArrowUpDown',
	
	// User & Account
	'user': 'User',
	'users': 'Users',
	'person': 'User',
	'people': 'Users',
	'account': 'User',
	'profile': 'User',
	'settings': 'Settings',
	'preferences': 'Settings',
	'config': 'Settings',
	'gear': 'Settings',
	'logout': 'LogOut',
	'login': 'LogIn',
	'signin': 'LogIn',
	'signout': 'LogOut',
	'signup': 'UserPlus',
	'register': 'UserPlus',
	
	// Communication
	'mail': 'Mail',
	'email': 'Mail',
	'message': 'MessageCircle',
	'chat': 'MessageCircle',
	'comment': 'MessageSquare',
	'send': 'Send',
	'reply': 'Reply',
	'phone': 'Phone',
	'call': 'Phone',
	'contact': 'Phone',
	'notification': 'Bell',
	'notifications': 'Bell',
	'alert': 'Bell',
	'alerts': 'Bell',
	'bell': 'Bell',
	
	// Media
	'image': 'Image',
	'photo': 'Camera',
	'picture': 'Image',
	'gallery': 'Images',
	'video': 'Video',
	'film': 'Film',
	'movie': 'Film',
	'play': 'Play',
	'pause': 'Pause',
	// 'stop' - not mapped, will use AI generation (square icon)
	'skip': 'SkipForward',
	'volume': 'Volume2',
	'mute': 'VolumeX',
	'music': 'Music',
	'song': 'Music',
	'audio': 'Volume2',
	
	// Files & Documents
	'file': 'File',
	'document': 'FileText',
	'folder': 'Folder',
	'directory': 'Folder',
	'download': 'Download',
	'upload': 'Upload',
	'share': 'Share',
	'link': 'Link',
	'external-link': 'ExternalLink',
	'copy': 'Copy',
	'cut': 'Scissors',
	'paste': 'Clipboard',
	'print': 'Printer',
	'scan': 'Scan',
	'archive': 'Archive',
	
	// Commerce
	'shopping-cart': 'ShoppingCart',
	'cart': 'ShoppingCart',
	'bag': 'ShoppingBag',
	'shopping-bag': 'ShoppingBag',
	'basket': 'ShoppingBasket',
	'shopping-basket': 'ShoppingBasket',
	'buy': 'ShoppingCart',
	'purchase': 'ShoppingCart',
	'checkout': 'ShoppingCart',
	'payment': 'CreditCard',
	'card': 'CreditCard',
	'credit-card': 'CreditCard',
	'wallet': 'Wallet',
	'money': 'DollarSign',
	'dollar-sign': 'DollarSign',
	'price': 'Tag',
	'tag': 'Tag',
	'tags': 'Tags',
	'discount': 'Percent',
	'coupon': 'Ticket',
	'gift': 'Gift',
	'package': 'Package',
	'delivery': 'Truck',
	'delivery-truck': 'Truck',
	'shipping': 'Truck',
	
	// Social & Engagement
	'like': 'Heart',
	'love': 'Heart',
	'favorite': 'Heart',
	'favorites': 'Heart',
	'bookmark': 'Bookmark',
	'star': 'Star',
	'rating': 'Star',
	'review': 'Star',
	'follow': 'UserPlus',
	'unfollow': 'UserMinus',
	
	// Security & Privacy
	'lock': 'Lock',
	'unlock': 'Unlock',
	'security': 'Shield',
	'shield': 'Shield',
	'key': 'Key',
	'password': 'Key',
	'eye': 'Eye',
	'view': 'Eye',
	'hide': 'EyeOff',
	'eye-off': 'EyeOff',
	'privacy': 'Shield',
	'protected': 'Lock',
	
	// Data & Analytics
	'chart': 'BarChart',
	'graph': 'BarChart',
	'analytics': 'BarChart',
	'stats': 'BarChart',
	'statistics': 'BarChart',
	'dashboard': 'LayoutDashboard',
	'report': 'FileText',
	'data': 'Database',
	'database': 'Database',
	'table': 'Table',
	'list': 'List',
	'grid': 'Grid',
	'trending-up': 'TrendingUp',
	'trending-down': 'TrendingDown',
	'activity': 'Activity',
	'zap': 'Zap',
	'bolt': 'Zap',
	'lightning': 'Zap',
	
	// Time & Date
	'calendar': 'Calendar',
	'date': 'Calendar',
	'clock': 'Clock',
	'time': 'Clock',
	'schedule': 'Calendar',
	'event': 'Calendar',
	'reminder': 'Bell',
	'timer': 'Timer',
	
	// Location & Map
	'location': 'MapPin',
	'pin': 'MapPin',
	'map': 'Map',
	'compass': 'Compass',
	'route': 'Route',
	'directions': 'Navigation',
	
	// Weather & Nature
	'sun': 'Sun',
	'moon': 'Moon',
	'cloud': 'Cloud',
	'rain': 'CloudRain',
	'snow': 'CloudSnow',
	'wind': 'Wind',
	'storm': 'CloudLightning',
	'weather': 'Cloud',
	'umbrella': 'Umbrella',
	
	// Objects & Tools
	'wrench': 'Wrench',
	'tool': 'Wrench',
	'tools': 'Wrench',
	'scissors': 'Scissors',
	'brush': 'Brush',
	'pen': 'PenTool',
	'pencil': 'Pencil',
	'paint': 'Palette',
	'palette': 'Palette',
	'color': 'Palette',
	'layers': 'Layers',
	'crop': 'Crop',
	'rotate': 'RotateCw',
	'flip': 'FlipHorizontal',
	'zoom-in': 'ZoomIn',
	'zoom-out': 'ZoomOut',
	'maximize': 'Maximize',
	'minimize': 'Minimize',
	'fullscreen': 'Maximize',
	
	// Technology
	'computer': 'Monitor',
	'desktop': 'Monitor',
	'monitor': 'Monitor',
	'laptop': 'Laptop',
	'mobile': 'Smartphone',
	'smartphone': 'Smartphone',
	'tablet': 'Tablet',
	'server': 'Server',
	'wifi': 'Wifi',
	'bluetooth': 'Bluetooth',
	'battery': 'Battery',
	'power': 'Power',
	'plug': 'Plug',
	'usb': 'Usb',
	'hard-drive': 'HardDrive',
	'harddrive': 'HardDrive',
	'memory': 'Database',
	'storage': 'HardDrive',
	'code': 'FileText', // Use FileText as code icon
	'coding': 'FileText',
	'programming': 'FileText',
	
	// Food & Drink
	'food': 'Utensils',
	'restaurant': 'Utensils',
	'coffee': 'Coffee',
	'drink': 'Coffee',
	'wine': 'Wine',
	'beer': 'Beer',
	'cake': 'Cake',
	'chef-hat': 'ChefHat', // Use Utensils if ChefHat doesn't exist
	'chef': 'Utensils',
	'burger': 'Utensils',
	'pizza': 'Utensils',
	'meal': 'Utensils',
	'dining': 'Utensils',
	
	// Transportation
	'car': 'Car',
	'vehicle': 'Car',
	'truck': 'Truck',
	'bus': 'Bus',
	'train': 'Train',
	'plane': 'Plane',
	'flight': 'Plane',
	'airplane': 'Plane',
	'ship': 'Ship',
	'boat': 'Ship',
	'bike': 'Bike',
	'bicycle': 'Bike',
	'motorcycle': 'Bike',
	
	// Buildings & Places
	'building': 'Building',
	'home': 'Home',
	'house': 'Home',
	'store': 'Store',
	'shop': 'Store',
	'bank': 'Building',
	'hospital': 'Building',
	'office': 'Building',
	'factory': 'Building',
	'warehouse': 'Warehouse',
	
	// Health & Medical
	'health': 'Heart',
	'medical': 'Heart',
	'doctor': 'User',
	'patient': 'User',
	'medicine': 'Pill',
	'pill': 'Pill',
	'first-aid': 'Bandage',
	'bandage': 'Bandage',
	'stethoscope': 'Heart', // Use Heart as closest match (stethoscope not in Lucide)
	'ambulance': 'Truck',
	'user-md': 'User',
	'medical-cross': 'Plus', // Use Plus as closest match
	
	// Education
	'education': 'GraduationCap',
	'school': 'GraduationCap',
	'student': 'User',
	'teacher': 'User',
	'book': 'Book',
	'book-open': 'BookOpen',
	'library': 'BookOpen',
	'learn': 'BookOpen',
	'study': 'BookOpen',
	'course': 'Book',
	'lesson': 'Book',
	'graduation-cap': 'GraduationCap',
	'certificate': 'FileText',
	
	// Sports & Fitness
	'sport': 'Trophy',
	'sports': 'Trophy',
	'fitness': 'Dumbbell',
	'gym': 'Dumbbell',
	'exercise': 'Dumbbell',
	'workout': 'Dumbbell',
	'trophy': 'Trophy',
	'medal': 'Award',
	'award': 'Award',
	'winner': 'Trophy',
	'champion': 'Trophy',
	'game': 'Gamepad2',
	'gaming': 'Gamepad2',
	
	// Entertainment
	'tv': 'Tv',
	'television': 'Tv',
	'radio': 'Radio',
	'podcast': 'Radio',
	'streaming': 'Video',
	'theater': 'Film',
	'concert': 'Music',
	'performance': 'Music',
	
	// Travel & Tourism
	'travel': 'Plane',
	'trip': 'Plane',
	'vacation': 'Plane',
	'holiday': 'Plane',
	'hotel': 'Building',
	'resort': 'Building',
	'beach': 'Sun',
	'mountain': 'Mountain',
	'forest': 'TreePine',
	'park': 'TreePine',
	'nature': 'TreePine',
	'camping': 'Tent',
	'tent': 'Tent',
	'hiking': 'Mountain',
	'climbing': 'Mountain',
	'skiing': 'Mountain',
	'snowboarding': 'Mountain',
	'surfing': 'Waves',
	'swimming': 'Waves',
	'diving': 'Waves',
	'fishing': 'Fish',
	'hunting': 'Target',
	'shooting': 'Target',
	'archery': 'Target',
	
	// Animals & Pets
	'animal': 'Heart',
	'pet': 'Heart',
	'dog': 'Dog',
	'cat': 'Cat',
	'bird': 'Bird',
	'fish': 'Fish',
	'rabbit': 'Rabbit',
	'mouse': 'Mouse',
	'rat': 'Mouse',
	'snake': 'Snake',
	'lizard': 'Lizard',
	'turtle': 'Turtle',
	'frog': 'Frog',
	'spider': 'Spider',
	'bee': 'Bee',
	'butterfly': 'Butterfly',
	'dragonfly': 'Dragonfly',
	'ant': 'Ant',
	'beetle': 'Beetle',
	'grasshopper': 'Grasshopper',
	'cricket': 'Cricket',
	'mosquito': 'Mosquito',
	'fly': 'Fly',
	'moth': 'Butterfly',
	'caterpillar': 'Caterpillar',
	'worm': 'Worm',
	'snail': 'Snail',
	'octopus': 'Octopus',
	'squid': 'Squid',
	'crab': 'Crab',
	'whale': 'Whale',
	'dolphin': 'Dolphin',
	'seal': 'Seal',
	'horse': 'Horse',
	'pony': 'Horse',
	'donkey': 'Donkey',
	'mule': 'Donkey',
	'zebra': 'Zebra',
	'giraffe': 'Giraffe',
	'elephant': 'Elephant',
	'rhino': 'Rhino',
	'hippo': 'Hippo',
	'pig': 'Pig',
	'cow': 'Cow',
	'bull': 'Bull',
	'ox': 'Ox',
	'buffalo': 'Buffalo',
	'bison': 'Bison',
	'sheep': 'Sheep',
	'deer': 'Deer',
	'elk': 'Elk',
	'moose': 'Moose',
	'reindeer': 'Reindeer',
	'camel': 'Camel',
	'llama': 'Llama',
	'lion': 'Lion',
	'tiger': 'Tiger',
	'leopard': 'Leopard',
	'jaguar': 'Jaguar',
	'cheetah': 'Cheetah',
	'puma': 'Puma',
	'panther': 'Panther',
	'lynx': 'Lynx',
	'bobcat': 'Lynx',
	
	// Common brand icons
	'brand': 'Sparkles',
	'featured': 'Star',
	'premium': 'Crown',
	'warning': 'AlertTriangle',
	'error': 'AlertCircle',
	'info': 'Info',
	'help': 'HelpCircle',
	'question': 'HelpCircle'
};

/**
 * Normalize icon name for matching
 */
function normalizeIconName(name: string): string {
	if (!name) return '';
	
	// Convert to lowercase and remove special characters
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

/**
 * Get Lucide icon name from user input
 * Returns the Lucide icon component name or null if not found
 */
export function getIconName(iconName: string): string | null {
	if (!iconName) return null;
	
	const normalized = normalizeIconName(iconName);
	
	// Direct match
	if (iconNameMap[normalized]) {
		return iconNameMap[normalized];
	}
	
	// Try partial match (e.g., "shopping cart" -> "shopping-cart")
	const parts = normalized.split('-');
	for (let i = parts.length; i > 0; i--) {
		const combined = parts.slice(0, i).join('-');
		if (iconNameMap[combined]) {
			return iconNameMap[combined];
		}
	}
	
	// Try reverse partial match (e.g., "cart shopping" -> "shopping-cart")
	for (let i = parts.length - 1; i >= 0; i--) {
		const combined = parts.slice(i).join('-');
		if (iconNameMap[combined]) {
			return iconNameMap[combined];
		}
	}
	
	// Try fuzzy match on individual words
	for (const part of parts) {
		if (iconNameMap[part]) {
			return iconNameMap[part];
		}
	}
	
	return null;
}

/**
 * Get all available icon names
 */
export function getAvailableIconNames(): string[] {
	return Object.keys(iconNameMap);
}
