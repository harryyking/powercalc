export type TariffType = 'residential' | 'lifeline' | 'business';

export type UsageFrequency = 'daily' | 'weekly';

export interface Appliance {
  id: string;
  name: string;
  emoji: string;
  category: ApplianceCategory;
  defaultWatts: number;
  // hours per day (for weekly items this is converted internally)
  defaultHoursPerDay: number;
  usageFrequency: UsageFrequency;
  // for weekly items, defaultUsesPerWeek replaces hours
  defaultUsesPerWeek?: number;
  // minutes per use (for short-burst appliances like kettle, microwave)
  minutesPerUse?: number;
  minHours: number;
  maxHours: number;
  stepHours: number;
}

export interface ActiveAppliance extends Appliance {
  watts: number;       // user can override
  hoursPerDay: number; // user-set
  quantity: number;
}

export type ApplianceCategory =
  | 'lighting'
  | 'cooling'
  | 'kitchen'
  | 'entertainment'
  | 'laundry'
  | 'other';

export interface CalculationResult {
  totalKwh: number;
  dailyKwh: number;
  dailyCostGhs: number;
  daysLeft: number;
  hoursRemainder: number;
  breakdown: ApplianceBreakdown[];
  tariffType: TariffType;
  creditGhs: number;
  serviceCharge: number; // ECG fixed monthly service charge
  usableCredit: number;  // credit after service charge
}

export interface ApplianceBreakdown {
  appliance: ActiveAppliance;
  dailyKwh: number;
  dailyCostGhs: number;
  percentageOfTotal: number;
  // "what if" — days gained by removing this appliance
  daysGainedIfRemoved: number;
}

export interface CreditHistoryEntry {
  id: string;
  date: string;           // ISO string
  creditGhs: number;
  tariffType: TariffType;
  estimatedDays: number;
  actualDays?: number;    // filled in when user marks "units finished"
  appliances: ActiveAppliance[];
  dailyCostGhs: number;
}

export interface TariffBand {
  minKwh: number;
  maxKwh: number | null;  // null = no upper limit
  ratePerKwh: number;
  serviceChargePerMonth: number;
}

export interface TariffConfig {
  type: TariffType;
  label: string;
  description: string;
  bands: TariffBand[];
  lastUpdated: string;    // PURC update date
}