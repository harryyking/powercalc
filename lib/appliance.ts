import type { Appliance, ApplianceCategory } from '../types';

/**
 * Ghana-specific appliance list.
 *
 * Wattages sourced from:
 *  - PURC PECE web estimator (purcghapp.com) — baseline values
 *  - Energy Commission of Ghana appliance efficiency data
 *  - Common appliance labels sold in Ghana (Accra market survey)
 *
 * Usage hours are Ghanaian household averages — not generic Western defaults.
 * e.g. fans run longer (heat), fridges run ~20h not 24h (dumsor), etc.
 */

// ─── Lighting ────────────────────────────────────────────────────────────────

const lighting: Appliance[] = [
  {
    id: 'led_bulb',
    name: 'LED Bulb',
    emoji: '💡',
    category: 'lighting',
    defaultWatts: 9,
    defaultHoursPerDay: 6,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 12,
    stepHours: 0.5,
  },
  {
    id: 'fluorescent_tube',
    name: 'Fluorescent Tube',
    emoji: '🔦',
    category: 'lighting',
    defaultWatts: 36,
    defaultHoursPerDay: 6,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 12,
    stepHours: 0.5,
  },
  {
    id: 'security_light',
    name: 'Security / Flood Light',
    emoji: '🔆',
    category: 'lighting',
    defaultWatts: 100,
    defaultHoursPerDay: 10,
    usageFrequency: 'daily',
    minHours: 4,
    maxHours: 14,
    stepHours: 1,
  },
];

// ─── Cooling ──────────────────────────────────────────────────────────────────

const cooling: Appliance[] = [
  {
    id: 'ceiling_fan',
    name: 'Ceiling Fan',
    emoji: '🌀',
    category: 'cooling',
    defaultWatts: 75,
    defaultHoursPerDay: 10,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 24,
    stepHours: 0.5,
  },
  {
    id: 'standing_fan',
    name: 'Standing / Table Fan',
    emoji: '🌬️',
    category: 'cooling',
    defaultWatts: 55,
    defaultHoursPerDay: 10,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 24,
    stepHours: 0.5,
  },
  {
    id: 'ac_1hp',
    name: 'Air Conditioner (1 HP)',
    emoji: '❄️',
    category: 'cooling',
    defaultWatts: 900,
    defaultHoursPerDay: 8,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 24,
    stepHours: 0.5,
  },
  {
    id: 'ac_1_5hp',
    name: 'Air Conditioner (1.5 HP)',
    emoji: '❄️',
    category: 'cooling',
    defaultWatts: 1200,
    defaultHoursPerDay: 8,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 24,
    stepHours: 0.5,
  },
  {
    id: 'ac_2hp',
    name: 'Air Conditioner (2 HP)',
    emoji: '❄️',
    category: 'cooling',
    defaultWatts: 1800,
    defaultHoursPerDay: 8,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 24,
    stepHours: 0.5,
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    emoji: '🧊',
    category: 'cooling',
    // Runs ~20h/day accounting for typical dumsor / compressor cycling
    defaultWatts: 150,
    defaultHoursPerDay: 20,
    usageFrequency: 'daily',
    minHours: 12,
    maxHours: 24,
    stepHours: 1,
  },
  {
    id: 'chest_freezer',
    name: 'Chest Freezer',
    emoji: '🧊',
    category: 'cooling',
    defaultWatts: 200,
    defaultHoursPerDay: 20,
    usageFrequency: 'daily',
    minHours: 12,
    maxHours: 24,
    stepHours: 1,
  },
];

// ─── Kitchen ──────────────────────────────────────────────────────────────────

const kitchen: Appliance[] = [
  {
    id: 'electric_kettle',
    name: 'Electric Kettle',
    emoji: '☕',
    category: 'kitchen',
    defaultWatts: 1500,
    // Convert: 3 fillings/day × ~5 min = 15 min = 0.25 h
    defaultHoursPerDay: 0.25,
    usageFrequency: 'daily',
    minHours: 0.08,  // ~5 min
    maxHours: 1,
    stepHours: 0.08,
  },
  {
    id: 'rice_cooker',
    name: 'Rice Cooker',
    emoji: '🍚',
    category: 'kitchen',
    defaultWatts: 700,
    defaultHoursPerDay: 1.5,
    usageFrequency: 'daily',
    minHours: 0.5,
    maxHours: 4,
    stepHours: 0.5,
  },
  {
    id: 'microwave',
    name: 'Microwave Oven',
    emoji: '📡',
    category: 'kitchen',
    defaultWatts: 1000,
    defaultHoursPerDay: 0.25, // ~15 min/day
    usageFrequency: 'daily',
    minHours: 0.08,
    maxHours: 1,
    stepHours: 0.08,
  },
  {
    id: 'electric_cooker',
    name: 'Electric Cooker / Hot Plate',
    emoji: '🍳',
    category: 'kitchen',
    defaultWatts: 1500,
    defaultHoursPerDay: 1.5,
    usageFrequency: 'daily',
    minHours: 0.5,
    maxHours: 6,
    stepHours: 0.5,
  },
  {
    id: 'blender',
    name: 'Blender / Juicer',
    emoji: '🥤',
    category: 'kitchen',
    defaultWatts: 400,
    defaultHoursPerDay: 0.17, // ~10 min/day
    usageFrequency: 'daily',
    minHours: 0.08,
    maxHours: 1,
    stepHours: 0.08,
  },
  {
    id: 'toaster',
    name: 'Toaster',
    emoji: '🍞',
    category: 'kitchen',
    defaultWatts: 800,
    defaultHoursPerDay: 0.17,
    usageFrequency: 'daily',
    minHours: 0.08,
    maxHours: 0.5,
    stepHours: 0.08,
  },
  {
    id: 'electric_iron',
    name: 'Electric Iron',
    emoji: '👔',
    category: 'kitchen', // grouped here as a household chore item
    defaultWatts: 1000,
    // Typically used 2–3 h per week → 0.43 h/day average
    defaultHoursPerDay: 0.43,
    usageFrequency: 'weekly',
    defaultUsesPerWeek: 3,
    minHours: 0,
    maxHours: 6,
    stepHours: 0.5,
  },
];

// ─── Entertainment ────────────────────────────────────────────────────────────

const entertainment: Appliance[] = [
  {
    id: 'tv_32',
    name: 'TV — 32"',
    emoji: '📺',
    category: 'entertainment',
    defaultWatts: 60,
    defaultHoursPerDay: 4,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 16,
    stepHours: 0.5,
  },
  {
    id: 'tv_43',
    name: 'TV — 43"+',
    emoji: '📺',
    category: 'entertainment',
    defaultWatts: 120,
    defaultHoursPerDay: 4,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 16,
    stepHours: 0.5,
  },
  {
    id: 'hifi',
    name: 'Hi-Fi / Sound System',
    emoji: '🔊',
    category: 'entertainment',
    defaultWatts: 100,
    defaultHoursPerDay: 3,
    usageFrequency: 'daily',
    minHours: 0.5,
    maxHours: 12,
    stepHours: 0.5,
  },
  {
    id: 'decoder',
    name: 'Decoder / Set-top Box',
    emoji: '📡',
    category: 'entertainment',
    defaultWatts: 15,
    defaultHoursPerDay: 4,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 16,
    stepHours: 0.5,
  },
  {
    id: 'computer',
    name: 'Desktop Computer',
    emoji: '🖥️',
    category: 'entertainment',
    defaultWatts: 200,
    defaultHoursPerDay: 6,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 16,
    stepHours: 0.5,
  },
  {
    id: 'laptop',
    name: 'Laptop',
    emoji: '💻',
    category: 'entertainment',
    defaultWatts: 65,
    defaultHoursPerDay: 6,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 16,
    stepHours: 0.5,
  },
  {
    id: 'phone_charger',
    name: 'Phone Charger',
    emoji: '🔌',
    category: 'entertainment',
    defaultWatts: 10,
    defaultHoursPerDay: 3,
    usageFrequency: 'daily',
    minHours: 0.5,
    maxHours: 12,
    stepHours: 0.5,
  },
  {
    id: 'wifi_router',
    name: 'WiFi Router / Modem',
    emoji: '📶',
    category: 'entertainment',
    defaultWatts: 12,
    defaultHoursPerDay: 24,
    usageFrequency: 'daily',
    minHours: 4,
    maxHours: 24,
    stepHours: 1,
  },
];

// ─── Laundry ──────────────────────────────────────────────────────────────────

const laundry: Appliance[] = [
  {
    id: 'washing_machine',
    name: 'Washing Machine',
    emoji: '🫧',
    category: 'laundry',
    defaultWatts: 500,
    // ~2 loads/week × 1 h/load ÷ 7 = 0.29 h/day
    defaultHoursPerDay: 0.29,
    usageFrequency: 'weekly',
    defaultUsesPerWeek: 2,
    minHours: 0,
    maxHours: 3,
    stepHours: 0.5,
  },
  {
    id: 'hair_dryer',
    name: 'Hair Dryer',
    emoji: '💨',
    category: 'laundry',
    defaultWatts: 1200,
    defaultHoursPerDay: 0.25,
    usageFrequency: 'daily',
    minHours: 0.08,
    maxHours: 1,
    stepHours: 0.08,
  },
];

// ─── Other ────────────────────────────────────────────────────────────────────

const other: Appliance[] = [
  {
    id: 'water_pump',
    name: 'Water Pump',
    emoji: '💧',
    category: 'other',
    defaultWatts: 370,
    defaultHoursPerDay: 1,
    usageFrequency: 'daily',
    minHours: 0.5,
    maxHours: 6,
    stepHours: 0.5,
  },
  {
    id: 'inverter_charger',
    name: 'Inverter / Battery Charger',
    emoji: '🔋',
    category: 'other',
    defaultWatts: 500,
    defaultHoursPerDay: 4,
    usageFrequency: 'daily',
    minHours: 1,
    maxHours: 12,
    stepHours: 0.5,
  },
  {
    id: 'vacuum_cleaner',
    name: 'Vacuum Cleaner',
    emoji: '🧹',
    category: 'other',
    defaultWatts: 1000,
    defaultHoursPerDay: 0.14, // ~1h/week
    usageFrequency: 'weekly',
    defaultUsesPerWeek: 1,
    minHours: 0,
    maxHours: 2,
    stepHours: 0.5,
  },
  {
    id: 'heater',
    name: 'Water Heater / Geyser',
    emoji: '🚿',
    category: 'other',
    defaultWatts: 1500,
    defaultHoursPerDay: 0.5,
    usageFrequency: 'daily',
    minHours: 0.17,
    maxHours: 4,
    stepHours: 0.17,
  },
];

// ─── Master list ──────────────────────────────────────────────────────────────

export const ALL_APPLIANCES: Appliance[] = [
  ...lighting,
  ...cooling,
  ...kitchen,
  ...entertainment,
  ...laundry,
  ...other,
];

export const APPLIANCES_BY_CATEGORY: Record<ApplianceCategory, Appliance[]> = {
  lighting,
  cooling,
  kitchen,
  entertainment,
  laundry,
  other,
};

export const CATEGORY_LABELS: Record<ApplianceCategory, string> = {
  lighting: 'Lighting',
  cooling: 'Cooling & Refrigeration',
  kitchen: 'Kitchen & Cooking',
  entertainment: 'Entertainment & Devices',
  laundry: 'Laundry & Personal Care',
  other: 'Other',
};

/** Quickly find an appliance definition by id */
export function getApplianceById(id: string): Appliance | undefined {
  return ALL_APPLIANCES.find((a) => a.id === id);
}

/**
 * Most-used appliances in a typical Ghanaian home —
 * shown as quick-add suggestions on the home screen.
 */
export const POPULAR_APPLIANCE_IDS = [
  'led_bulb',
  'ceiling_fan',
  'refrigerator',
  'tv_32',
  'phone_charger',
  'electric_iron',
  'water_pump',
  'ac_1hp',
  'rice_cooker',
  'electric_kettle',
];

export const POPULAR_APPLIANCES: Appliance[] = POPULAR_APPLIANCE_IDS
  .map(getApplianceById)
  .filter((a): a is Appliance => a !== undefined);