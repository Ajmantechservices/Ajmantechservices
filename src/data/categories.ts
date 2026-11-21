export interface MainCategoryDefinition {
  id: string;
  name: string;
  slug: string;
  iconName: string;
}

export const MAIN_CATEGORIES: MainCategoryDefinition[] = [
  {
    id: 'cat-bulbs-lighting',
    name: 'Bulbs and Lighting',
    slug: 'bulbs-and-lighting',
    iconName: 'Lightbulb',
  },
  {
    id: 'cat-solar-products',
    name: 'Solar Products',
    slug: 'solar-products',
    iconName: 'SunMedium',
  },
  {
    id: 'cat-electrical-sockets-switches',
    name: 'Electrical Sockets and Switches',
    slug: 'electrical-sockets-and-switches',
    iconName: 'ToggleRight',
  },
  {
    id: 'cat-fancy-lights',
    name: 'Fancy Lights',
    slug: 'fancy-lights',
    iconName: 'Sparkles',
  },
  {
    id: 'cat-chandeliers',
    name: 'Chandeliers',
    slug: 'chandeliers',
    iconName: 'Gem',
  },
  {
    id: 'cat-security-cctv',
    name: 'Security and CCTV',
    slug: 'security-and-cctv',
    iconName: 'Camera',
  },
  {
    id: 'cat-electrical-accessories',
    name: 'Electrical Accessories',
    slug: 'electrical-accessories',
    iconName: 'Cable',
  },
];

export const MAIN_CATEGORY_NAMES: string[] = MAIN_CATEGORIES.map((c) => c.name);

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // 1. Bulbs and Lighting
  'bulbs': 'Bulbs and Lighting',
  'bulb': 'Bulbs and Lighting',
  'bulbs and lighting': 'Bulbs and Lighting',
  'bulbs & lighting': 'Bulbs and Lighting',
  'led bulbs': 'Bulbs and Lighting',
  'rope & strip lights': 'Bulbs and Lighting',
  'rope-lights': 'Bulbs and Lighting',
  'rope and strip lights': 'Bulbs and Lighting',
  'lighting': 'Bulbs and Lighting',

  // 2. Solar Products
  'solar': 'Solar Products',
  'solar products': 'Solar Products',
  'solar & inverters': 'Solar Products',
  'solar-inverters': 'Solar Products',
  'solar and inverters': 'Solar Products',
  'security & solar lights': 'Solar Products',
  'solar floodlights': 'Solar Products',

  // 3. Electrical Sockets and Switches
  'switches & electricals': 'Electrical Sockets and Switches',
  'switches-electrical': 'Electrical Sockets and Switches',
  'switches and electricals': 'Electrical Sockets and Switches',
  'electrical sockets and switches': 'Electrical Sockets and Switches',
  'sockets and switches': 'Electrical Sockets and Switches',
  'switches': 'Electrical Sockets and Switches',
  'sockets': 'Electrical Sockets and Switches',

  // 4. Fancy Lights
  'fancy lights': 'Fancy Lights',
  'fancy-lights': 'Fancy Lights',
  'wall sconces': 'Fancy Lights',

  // 5. Chandeliers
  'chandeliers': 'Chandeliers',
  'chandelier': 'Chandeliers',

  // 6. Security and CCTV
  'security and cctv': 'Security and CCTV',
  'security & cctv': 'Security and CCTV',
  'cctv & surveillance': 'Security and CCTV',
  'cctv': 'Security and CCTV',
  'security-lights': 'Security and CCTV',
  'surveillance': 'Security and CCTV',

  // 7. Electrical Accessories
  'electrical accessories': 'Electrical Accessories',
  'electrical-accessories': 'Electrical Accessories',
  'accessories': 'Electrical Accessories',
  'cables': 'Electrical Accessories',
  'breakers': 'Electrical Accessories',
  'industrial': 'Electrical Accessories',
};

export const LEGACY_SUBDIVIDED_CATEGORY_NAMES = new Set([
  'bulbs',
  'rope & strip lights',
  'security & solar lights',
  'cctv & surveillance',
  'solar & inverters',
  'switches & electricals',
]);

/**
 * Non-destructively maps any legacy product category string to one of the 7 main categories.
 * If a category name was custom-created or renamed by an administrator, preserves it as-is.
 */
export function normalizeMainCategory(rawCategory?: string | null): string {
  const cleaned = String(rawCategory || '').trim();
  if (!cleaned) return 'Electrical Accessories';

  const mapped = LEGACY_CATEGORY_MAP[cleaned.toLowerCase()];
  if (mapped) return mapped;

  return cleaned;
}

/**
 * Matches a product's category against a selected main category filter,
 * supporting both direct assignment and legacy category mapping without altering database rows.
 */
export function matchesCategoryFilter(
  productCategory?: string | null,
  selectedCategory?: string | null
): boolean {
  if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') {
    return true;
  }

  const prodClean = String(productCategory || '').trim().toLowerCase();
  const selClean = String(selectedCategory || '').trim().toLowerCase();

  if (prodClean === selClean) return true;

  return normalizeMainCategory(productCategory).toLowerCase() === normalizeMainCategory(selectedCategory).toLowerCase();
}

export function slugifyCategoryName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
