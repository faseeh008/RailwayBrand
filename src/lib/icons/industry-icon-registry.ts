import {
	LaptopIcon,
	CpuIcon,
	CloudIcon,
	CodeIcon,
	ShieldKeyIcon,
	ServerStack01Icon,
	House01Icon,
	RealEstate01Icon,
	Building01Icon,
	MapPinIcon,
	Key01Icon,
	StoreLocation01Icon,
	Dumbbell01Icon,
	Yoga01Icon,
	Treadmill01Icon,
	RunningShoesIcon,
	WorkoutRunIcon,
	WellnessIcon,
	Leaf01Icon,
	TowelsIcon,
	SparklesIcon,
	PerfumeIcon,
	Hospital01Icon,
	Stethoscope02Icon,
	BandageIcon,
	VaccineIcon,
	HealthIcon,
	Restaurant01Icon,
	ChefHatIcon,
	ServingFoodIcon,
	Coffee01Icon,
	VegetarianFoodIcon,
	IceCream01Icon,
	BookOpen01Icon,
	GraduationScrollIcon,
	SchoolIcon,
	NotebookIcon,
	SchoolBusIcon,
	TruckDeliveryIcon,
	PackageIcon,
	Route01Icon,
	WarehouseIcon,
	ShippingTruck01Icon,
	SemiTruckIcon,
	CreditCardIcon,
	DollarCircleIcon,
	Wallet01Icon,
	BarChartIcon,
	SavingsIcon,
	PiggyBankIcon,
	ShoppingCart01Icon,
	ShoppingBag01Icon,
	Store01Icon,
	SaleTag01Icon,
	PackageDeliveredIcon,
	GiftIcon
} from '@hugeicons/core-free-icons';

type HugeIconDefinition = typeof LaptopIcon;

export type IndustryKey =
	| 'technology'
	| 'realEstate'
	| 'fitness'
	| 'beautySpa'
	| 'medicalHealthcare'
	| 'foodRestaurant'
	| 'education'
	| 'logistics'
	| 'finance'
	| 'ecommerce';

export interface IndustryIconDescriptor {
	id: string;
	name: string;
	icon: HugeIconDefinition;
}

export type IndustryIconRegistry = Record<IndustryKey, IndustryIconDescriptor[]>;

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
	technology: 'Technology',
	realEstate: 'Real Estate',
	fitness: 'Fitness',
	beautySpa: 'Beauty & Spa',
	medicalHealthcare: 'Medical & Healthcare',
	foodRestaurant: 'Food & Restaurant',
	education: 'Education',
	logistics: 'Logistics',
	finance: 'Finance',
	ecommerce: 'Ecommerce'
};

function descriptor(id: string, name: string, icon: HugeIconDefinition): IndustryIconDescriptor {
	return { id, name, icon };
}

export const industryIcons: IndustryIconRegistry = {
	technology: [
		descriptor('laptop', 'Laptop', LaptopIcon),
		descriptor('cpu', 'CPU', CpuIcon),
		descriptor('cloud', 'Cloud', CloudIcon),
		descriptor('code', 'Code', CodeIcon),
		descriptor('shield-key', 'Secure Access', ShieldKeyIcon),
		descriptor('server-stack', 'Server Stack', ServerStack01Icon)
	],
	realEstate: [
		descriptor('house', 'Home', House01Icon),
		descriptor('estate', 'Estate', RealEstate01Icon),
		descriptor('building', 'Building', Building01Icon),
		descriptor('location', 'Map Pin', MapPinIcon),
		descriptor('key', 'Keys', Key01Icon),
		descriptor('store-location', 'On-Site', StoreLocation01Icon)
	],
	fitness: [
		descriptor('dumbbell', 'Strength', Dumbbell01Icon),
		descriptor('yoga', 'Yoga Pose', Yoga01Icon),
		descriptor('treadmill', 'Treadmill', Treadmill01Icon),
		descriptor('running-shoes', 'Run Club', RunningShoesIcon),
		descriptor('workout-run', 'Training', WorkoutRunIcon)
	],
	beautySpa: [
		descriptor('wellness', 'Wellness', WellnessIcon),
		descriptor('leaf', 'Botanical', Leaf01Icon),
		descriptor('towels', 'Spa Towels', TowelsIcon),
		descriptor('sparkles', 'Glow', SparklesIcon),
		descriptor('perfume', 'Aromatics', PerfumeIcon)
	],
	medicalHealthcare: [
		descriptor('hospital', 'Hospital', Hospital01Icon),
		descriptor('stethoscope', 'Care Team', Stethoscope02Icon),
		descriptor('bandage', 'Recovery', BandageIcon),
		descriptor('vaccine', 'Vaccination', VaccineIcon),
		descriptor('health', 'Health', HealthIcon)
	],
	foodRestaurant: [
		descriptor('restaurant', 'Restaurant', Restaurant01Icon),
		descriptor('chef', 'Chef Hat', ChefHatIcon),
		descriptor('serving', 'Serving Dish', ServingFoodIcon),
		descriptor('coffee', 'Coffee', Coffee01Icon),
		descriptor('vegetarian', 'Fresh Produce', VegetarianFoodIcon),
		descriptor('dessert', 'Dessert', IceCream01Icon)
	],
	education: [
		descriptor('book-open', 'Open Book', BookOpen01Icon),
		descriptor('graduation', 'Graduation', GraduationScrollIcon),
		descriptor('school', 'Campus', SchoolIcon),
		descriptor('notebook', 'Notebook', NotebookIcon),
		descriptor('school-bus', 'School Bus', SchoolBusIcon)
	],
	logistics: [
		descriptor('truck-delivery', 'Delivery Truck', TruckDeliveryIcon),
		descriptor('package', 'Parcel', PackageIcon),
		descriptor('route', 'Route Plan', Route01Icon),
		descriptor('warehouse', 'Warehouse', WarehouseIcon),
		descriptor('shipping-truck', 'Line Haul', ShippingTruck01Icon),
		descriptor('semi-truck', 'Freight', SemiTruckIcon)
	],
	finance: [
		descriptor('credit-card', 'Card', CreditCardIcon),
		descriptor('dollar-circle', 'Dollar', DollarCircleIcon),
		descriptor('wallet', 'Wallet', Wallet01Icon),
		descriptor('bar-chart', 'Analytics', BarChartIcon),
		descriptor('savings', 'Savings', SavingsIcon),
		descriptor('piggy-bank', 'Piggy Bank', PiggyBankIcon)
	],
	ecommerce: [
		descriptor('shopping-cart', 'Cart', ShoppingCart01Icon),
		descriptor('shopping-bag', 'Shopping Bag', ShoppingBag01Icon),
		descriptor('store', 'Storefront', Store01Icon),
		descriptor('sale-tag', 'Sale Tag', SaleTag01Icon),
		descriptor('package-delivered', 'Delivered', PackageDeliveredIcon),
		descriptor('gift', 'Gift', GiftIcon)
	]
};

export const defaultIndustries: IndustryKey[] = Object.keys(industryIcons) as IndustryKey[];

