<script lang="ts">
  import { getIconName } from '$lib/utils/icon-mapper';
  import { generateIconSVG } from '$lib/utils/icon-generator';
  import type { ComponentType } from 'svelte';
  
  // Import only common icons that actually exist in Lucide
  import {
    // Actions
    Plus, Edit, Trash, Save, X, Check, CheckCircle, XCircle,
    // Navigation
    ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
    ChevronUp, ChevronDown, Navigation, Menu, Home, Search, Filter,
    // User & Account
    User, Users, Settings, LogOut, LogIn, UserPlus, UserMinus,
    // Communication
    Mail, MessageCircle, MessageSquare, Send, Reply, Phone, Bell,
    // Media
    Image, Camera, Video, Film, Play, Pause, SkipForward,
    Volume2, VolumeX, Music,
    // Files & Documents
    File, FileText, Folder, Download, Upload, Share, Link, ExternalLink,
    Copy, Scissors, Clipboard, Printer, Scan, Archive,
    // Commerce
    ShoppingCart, ShoppingBag, ShoppingBasket, CreditCard, Wallet,
    DollarSign, Tag, Tags, Percent, Ticket, Gift, Package, Truck,
    // Social
    Heart, Bookmark, Star,
    // Security
    Lock, Unlock, Shield, Key, Eye, EyeOff,
    // Data & Analytics
    BarChart, LayoutDashboard, Database, Table, List, Grid,
    TrendingUp, TrendingDown, Activity, Zap,
    // Time & Date
    Calendar, Clock, Timer,
    // Location
    MapPin, Map, Compass, Route,
    // Weather
    Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, CloudLightning, Umbrella,
    // Tools
    Wrench, Brush, PenTool, Pencil, Palette, Layers, Crop, RotateCw,
    FlipHorizontal, ZoomIn, ZoomOut, Maximize, Minimize,
    // Technology
    Monitor, Laptop, Smartphone, Tablet, Server, Wifi, Bluetooth,
    Battery, Power, Plug, Usb, HardDrive,
    // Food
    Utensils, Coffee, Wine, Beer, Cake,
    // Transportation
    Car, Bus, Train, Plane, Ship, Bike,
    // Buildings
    Building, Store, Warehouse,
    // Health
    Pill, Bandage,
    // Education
    GraduationCap, Book, BookOpen,
    // Sports
    Trophy, Award, Dumbbell, Gamepad2,
    // Entertainment
    Tv, Radio,
    // Nature
    TreePine, Tent, Waves, Fish, Target,
    // Animals (only common ones that exist)
    Dog, Cat, Bird, Rabbit, Mouse,
    // Icons & UI
    Sparkles, Crown, AlertTriangle, AlertCircle, Info, HelpCircle,
    ArrowUpDown
  } from 'lucide-svelte';

  const aiPriorityKeywords = [
    't-shirt',
    'shirt',
    'dress',
    'pants',
    'jeans',
    'skirt',
    'hoodie',
    'sweater',
    'jacket',
    'coat',
    'fashion',
    'apparel',
    'garment',
    'clothing',
    'shoe',
    'shoes',
    'sandal',
    'boot',
    'sneaker',
    'watch',
    'wristwatch',
    'timepiece'
  ];

  const shouldForceAIIcon = (iconName: string) => {
    if (!iconName) return false;
    const normalized = iconName.toLowerCase().trim();
    return aiPriorityKeywords.some((keyword) => normalized.includes(keyword));
  };

  // Icon mapping - map icon names to actual Lucide components
  const iconMap: Record<string, ComponentType> = {
    Plus, Edit, Trash, Save, X, Check, CheckCircle, XCircle,
    ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
    ChevronUp, ChevronDown, Navigation, Menu, Home, Search, Filter,
    User, Users, Settings, LogOut, LogIn, UserPlus, UserMinus,
    Mail, MessageCircle, MessageSquare, Send, Reply, Phone, Bell,
    Image, Camera, Video, Film, Play, Pause, SkipForward,
    Volume2, VolumeX, Music,
    File, FileText, Folder, Download, Upload, Share, Link, ExternalLink,
    Copy, Scissors, Clipboard, Printer, Scan, Archive,
    ShoppingCart, ShoppingBag, ShoppingBasket, CreditCard, Wallet,
    DollarSign, Tag, Tags, Percent, Ticket, Gift, Package, Truck,
    Heart, Bookmark, Star,
    Lock, Unlock, Shield, Key, Eye, EyeOff,
    BarChart, LayoutDashboard, Database, Table, List, Grid,
    TrendingUp, TrendingDown, Activity, Zap,
    Calendar, Clock, Timer,
    MapPin, Map, Compass, Route,
    Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, CloudLightning, Umbrella,
    Wrench, Brush, PenTool, Pencil, Palette, Layers, Crop, RotateCw,
    FlipHorizontal, ZoomIn, ZoomOut, Maximize, Minimize,
    Monitor, Laptop, Smartphone, Tablet, Server, Wifi, Bluetooth,
    Battery, Power, Plug, Usb, HardDrive,
    Utensils, Coffee, Wine, Beer, Cake,
    Car, Bus, Train, Plane, Ship, Bike,
    Building, Store, Warehouse,
    Pill, Bandage,
    GraduationCap, Book, BookOpen,
    Trophy, Award, Dumbbell, Gamepad2,
    Tv, Radio,
    TreePine, Tent, Waves, Fish, Target,
    Dog, Cat, Bird, Rabbit, Mouse,
    Sparkles, Crown, AlertTriangle, AlertCircle, Info, HelpCircle,
    ArrowUpDown
  };

  interface Props {
    name: string;
    size?: number | string;
    color?: string;
    class?: string;
    strokeWidth?: number;
  }

  let { 
    name, 
    size = 24, 
    color, 
    class: className = '', 
    strokeWidth = 2 
  }: Props = $props();

  // Get the icon component from the name with aggressive fallback matching
  const iconComponent = $derived.by(() => {
    if (!name) return null;
    if (shouldForceAIIcon(name)) return null;
    
    const normalizedName = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    // Strategy 1: Try to get mapped icon name from icon-mapper
    const mappedName = getIconName(name);
    if (mappedName && iconMap[mappedName]) {
      return iconMap[mappedName];
    }
    
    // Strategy 2: Try direct name match (case-insensitive)
    const directMatch = Object.keys(iconMap).find(
      key => key.toLowerCase() === normalizedName
    );
    if (directMatch) {
      return iconMap[directMatch];
    }
    
    // Strategy 3: Try partial match (e.g., "shopping-cart" -> "ShoppingCart")
    const camelCaseMatch = Object.keys(iconMap).find(
      key => key.toLowerCase().replace(/-/g, '') === normalizedName.replace(/-/g, '')
    );
    if (camelCaseMatch) {
      return iconMap[camelCaseMatch];
    }
    
    // Strategy 4: Try fuzzy match - find icon that contains key words
    const words = normalizedName.split('-').filter(w => w.length > 2);
    for (const word of words) {
      const fuzzyMatch = Object.keys(iconMap).find(
        key => key.toLowerCase().includes(word) || word.includes(key.toLowerCase())
      );
      if (fuzzyMatch) {
        return iconMap[fuzzyMatch];
      }
    }
    
    // Strategy 5: Try reverse fuzzy match - find icon name that's contained in the input
    for (const key of Object.keys(iconMap)) {
      if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName.split('-')[0])) {
        return iconMap[key];
      }
    }
    
    // If not found in Lucide, return null to trigger AI icon generation
    return null;
  });

  // State for AI-generated icon
  let aiIconSVG: string | null = $state(null);
  let isGeneratingIcon = $state(false);
  
  // Find best fallback Lucide icon if exact match not found
  const findFallbackIcon = (iconName: string): ComponentType | null => {
    if (!iconName) return null;
    if (shouldForceAIIcon(iconName)) return null;
    
    // First try the icon mapper which has fallback logic built-in
    const mappedName = getIconName(iconName);
    if (mappedName && iconMap[mappedName]) {
      return iconMap[mappedName];
    }
    
    const normalized = iconName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const words = normalized.split('-').filter(w => w.length > 2);
    
    // Try to find similar icon by keyword matching with priority order
    const keywordMap: Record<string, string[]> = {
      'shopping': ['ShoppingCart', 'ShoppingBag', 'ShoppingBasket'],
      'medical': ['Heart', 'Pill', 'Shield', 'Activity'],
      'food': ['Utensils', 'Coffee', 'Wine', 'Cake'],
      'tech': ['Monitor', 'Laptop', 'Smartphone', 'Server', 'Wifi', 'Cloud'],
      'education': ['GraduationCap', 'Book', 'BookOpen', 'Pencil'],
      'finance': ['DollarSign', 'CreditCard', 'Wallet', 'BarChart', 'TrendingUp'],
      'building': ['Building', 'Home', 'Store', 'Warehouse'],
      'transport': ['Car', 'Bus', 'Train', 'Plane', 'Ship', 'Bike', 'Truck'],
      'fitness': ['Dumbbell', 'Trophy', 'Award', 'Target', 'Activity', 'Heart'],
      'creative': ['Brush', 'Palette', 'Image', 'Camera', 'Video', 'Layers', 'PenTool']
    };
    
    // Try keyword matching (prioritize longer, more specific matches)
    const sortedWords = words.sort((a, b) => b.length - a.length);
    for (const word of sortedWords) {
      for (const [keyword, icons] of Object.entries(keywordMap)) {
        if (word.includes(keyword) || keyword.includes(word)) {
          for (const icon of icons) {
            if (iconMap[icon]) {
              return iconMap[icon];
            }
          }
        }
      }
    }
    
    // Try partial word match in icon names
    for (const word of sortedWords) {
      for (const key of Object.keys(iconMap)) {
        if (key.toLowerCase().includes(word) || word.includes(key.toLowerCase().substring(0, 3))) {
          return iconMap[key];
        }
      }
    }
    
    return null;
  };
  
  // Get fallback icon component
  const fallbackIconComponent = $derived.by(() => {
    if (iconComponent !== null) return null; // Exact match found, no need for fallback
    if (!name) return null;
    return findFallbackIcon(name);
  });
  
  // Generate professional icon using Gemini API when Lucide icon is not available
  const generateProfessionalIcon = async () => {
    // If we have a Lucide icon (exact or fallback), use it instead of AI
    if (iconComponent !== null || fallbackIconComponent !== null) {
      aiIconSVG = null;
      return;
    }
    
    if (!name || isGeneratingIcon) return;
    
    isGeneratingIcon = true;
    
    try {
      const iconSize = typeof size === 'number' ? size : parseInt(size as string) || 24;
      const iconColor = color || 'currentColor';
      const iconStrokeWidth = strokeWidth || 2;
      
      // Try to generate professional icon using Gemini API
      const response = await fetch('/api/generate-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iconName: name,
          size: iconSize,
          color: iconColor,
          strokeWidth: iconStrokeWidth,
          style: 'minimal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.svg && data.svg.trim().length > 0) {
          aiIconSVG = data.svg;
          return;
        }
      }
      
      // If API fails, try fallback icon one more time before using letter-based generator
      const finalFallback = findFallbackIcon(name);
      if (finalFallback) {
        // Use the fallback icon instead of generating
        aiIconSVG = null;
        isGeneratingIcon = false;
        return;
      }
      
      // Last resort: use local letter-based generator
      aiIconSVG = generateIconSVG(name, iconSize, iconColor, iconStrokeWidth);
    } catch (error) {
      console.error('Error generating professional icon:', error);
      
      // Try fallback icon before using letter generator
      const finalFallback = findFallbackIcon(name);
      if (finalFallback) {
        aiIconSVG = null;
        isGeneratingIcon = false;
        return;
      }
      
      // Last resort: local generator
      const iconSize = typeof size === 'number' ? size : parseInt(size as string) || 24;
      const iconColor = color || 'currentColor';
      const iconStrokeWidth = strokeWidth || 2;
      aiIconSVG = generateIconSVG(name, iconSize, iconColor, iconStrokeWidth);
    } finally {
      isGeneratingIcon = false;
    }
  };
  
  // Generate icon when name changes and no Lucide icon is available
  $effect(() => {
    // If we have exact match or fallback, don't generate AI icon
    if (iconComponent !== null || fallbackIconComponent !== null) {
      aiIconSVG = null;
      return;
    }
    
    // Only generate AI icon if we don't have any Lucide match
    if (!iconComponent && !fallbackIconComponent && name) {
      generateProfessionalIcon();
    } else {
      aiIconSVG = null;
    }
  });

  // Default props for the icon
  const iconProps = $derived({
    size: typeof size === 'number' ? size : parseInt(size as string) || 24,
    color: color || 'currentColor',
    class: className,
    strokeWidth: strokeWidth || 2
  });
</script>

{#if iconComponent}
  <!-- Exact Lucide icon match -->
  <svelte:component this={iconComponent} {...iconProps} />
{:else if fallbackIconComponent}
  <!-- Fallback Lucide icon match -->
  <svelte:component this={fallbackIconComponent} {...iconProps} />
{:else if aiIconSVG}
  <!-- AI-generated icon -->
  <div class="ai-icon-wrapper" class:className style="--icon-size: {typeof size === 'number' ? size + 'px' : size};">
    {@html aiIconSVG}
  </div>
{:else if isGeneratingIcon}
  <!-- Loading state -->
  <div class="icon-loading" class:className>
    <HelpCircle {...iconProps} />
  </div>
{:else}
  <!-- Final fallback: HelpCircle -->
  <HelpCircle {...iconProps} />
{/if}

<style>
  .ai-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size, 24px);
    height: var(--icon-size, 24px);
    flex-shrink: 0;
  }
  
  .ai-icon-wrapper :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    flex-shrink: 0;
  }
  
  .icon-loading {
    opacity: 0.6;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
</style>
