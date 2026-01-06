/**
 * Map Configuration
 * Centralized configuration for map styles and markers
 */

export type MapStyle = 'dark' | 'light' | 'colorful' | 'satellite';

export interface MapStyleConfig {
  name: string;
  url: string;
  attribution?: string;
  maxZoom?: number;
  subdomains?: string;
}

export interface MarkerConfig {
  size: number;
  iconSize: [number, number];
  iconAnchor: [number, number];
  className: string;
}

/**
 * Available map styles
 */
export const MAP_STYLES: Record<MapStyle, MapStyleConfig> = {
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  light: {
    name: 'Light',
    // Using OpenStreetMap standard tiles for better building visibility
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  colorful: {
    name: 'Colorful',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
};

/**
 * Default marker configuration
 */
export const DEFAULT_MARKER_CONFIG: MarkerConfig = {
  size: 32,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: 'task-location-marker',
};

/**
 * Get map style based on theme preference
 * Uses light style by default for better clarity of buildings, roads, and details
 */
export function getMapStyle(preferredStyle?: MapStyle, isDarkMode?: boolean): MapStyle {
  if (preferredStyle) {
    return preferredStyle;
  }
  
  // Always use light style for better clarity of buildings, roads, and details
  // Even in dark mode, light map style provides better visibility
  return 'light';
}

/**
 * Get map style configuration
 */
export function getMapStyleConfig(style: MapStyle = 'colorful'): MapStyleConfig {
  return MAP_STYLES[style] || MAP_STYLES.colorful;
}

/**
 * Create a tile layer configuration for Leaflet
 */
export function createTileLayerConfig(style: MapStyle = 'colorful') {
  const config = getMapStyleConfig(style);
  
  const tileConfig: any = {
    minZoom: 1,
    maxZoom: config.maxZoom || 20,
    attribution: config.attribution || '',
  };
  
  if (config.subdomains) {
    tileConfig.subdomains = config.subdomains;
  }
  
  return {
    url: config.url,
    options: tileConfig,
  };
}

/**
 * Generate marker HTML with enhanced styling
 */
export function generateMarkerHTML(
  size: number = 32,
  pulse: boolean = true,
  variant: 'primary' | 'accent' = 'primary'
): string {
  const pulseClass = pulse ? 'animate-ping' : '';
  const iconSize = size / 2;
  const containerSize = size;
  
  // Use CSS classes and data attributes for better styling control
  const variantClass = variant === 'primary' ? 'marker-primary' : 'marker-accent';
  
  return `
    <div class="relative marker-container" style="width: ${containerSize}px; height: ${containerSize}px;">
      ${pulse ? `<div class="absolute inset-0 rounded-full ${pulseClass} marker-pulse ${variantClass}"></div>` : ''}
      <div class="relative rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 marker-circle ${variantClass}" 
           style="width: ${containerSize}px; height: ${containerSize}px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Create a Leaflet div icon for markers
 */
export function createMarkerIcon(
  L: any,
  config: Partial<MarkerConfig> = {},
  pulse: boolean = true,
  variant: 'primary' | 'accent' = 'primary'
) {
  const markerConfig = { ...DEFAULT_MARKER_CONFIG, ...config };
  const html = generateMarkerHTML(markerConfig.size, pulse, variant);
  
  return L.divIcon({
    className: markerConfig.className,
    html,
    iconSize: markerConfig.iconSize,
    iconAnchor: markerConfig.iconAnchor,
  });
}













