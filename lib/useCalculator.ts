import { useMemo } from 'react';
// eslint-disable-next-line import/no-unresolved
import { creditToKwh, getServiceCharge } from '@/constants/tariffs';
import type {
  ActiveAppliance,
  ApplianceBreakdown,
  CalculationResult,
  TariffType,
} from '@/types';


/**
 * useCalculator
 *
 * Core calculation hook for PowerCalc GH.
 *
 * Given:
 *  - creditGhs   : prepaid credit purchased (GHS)
 *  - tariffType  : residential | lifeline | business
 *  - appliances  : list of active appliances with user-set watts & hours
 *
 * Returns a full CalculationResult including:
 *  - how many days/hours the credit will last
 *  - daily kWh and daily cost
 *  - per-appliance breakdown with "what if" gains
 *  - service charge deduction
 */
export function useCalculator(
  creditGhs: number,
  tariffType: TariffType,
  appliances: ActiveAppliance[],
): CalculationResult | null {
  return useMemo(() => {
    if (creditGhs <= 0) return null;

    // ── 1. Deduct the monthly ECG service charge ──────────────────────────
    // ECG deducts a fixed service charge from every prepaid top-up.
    // We prorate it: if the credit is small, most of it goes to service charge.
    // We cap the deduction at 50% of credit so the result stays useful.
    const monthlyServiceCharge = getServiceCharge(tariffType);
    const proratedServiceCharge = Math.min(
      monthlyServiceCharge,
      creditGhs * 0.5,
    );
    const usableCredit = Math.max(0, creditGhs - proratedServiceCharge);

    // ── 2. Convert usable credit to total kWh ─────────────────────────────
    // Uses tiered band logic (lifeline band is cheaper per kWh than standard).
    const totalKwh = creditToKwh(tariffType, usableCredit);

    // ── 3. Calculate daily consumption ───────────────────────────────────
    const activeAppliances = appliances.filter(
      (a) => a.hoursPerDay > 0 && a.watts > 0 && a.quantity > 0,
    );

    if (activeAppliances.length === 0) {
      return {
        totalKwh,
        dailyKwh: 0,
        dailyCostGhs: 0,
        daysLeft: Infinity,
        hoursRemainder: 0,
        breakdown: [],
        tariffType,
        creditGhs,
        serviceCharge: proratedServiceCharge,
        usableCredit,
      };
    }

    // Daily kWh per appliance: (watts × quantity × hoursPerDay) / 1000
    const applianceData = activeAppliances.map((appliance) => {
      const dailyKwh =
        (appliance.watts * appliance.quantity * appliance.hoursPerDay) / 1000;
      return { appliance, dailyKwh };
    });

    const totalDailyKwh = applianceData.reduce(
      (sum, { dailyKwh }) => sum + dailyKwh,
      0,
    );

    // ── 4. How many days does the credit last? ────────────────────────────
    const exactDays = totalDailyKwh > 0 ? totalKwh / totalDailyKwh : Infinity;
    const daysLeft = Math.floor(exactDays);
    const hoursRemainder = Math.round((exactDays - daysLeft) * 24);

    // ── 5. Effective rate for cost display ────────────────────────────────
    // Use simple rate from primary band for daily cost display.
    // (Full tiered cost is already baked into totalKwh via creditToKwh)
    const effectiveRatePerKwh =
      usableCredit > 0 ? usableCredit / totalKwh : 0;

    const totalDailyCostGhs = totalDailyKwh * effectiveRatePerKwh;

    // ── 6. Per-appliance breakdown ────────────────────────────────────────
    const breakdown: ApplianceBreakdown[] = applianceData
      .map(({ appliance, dailyKwh }) => {
        const dailyCostGhs = dailyKwh * effectiveRatePerKwh;
        const percentageOfTotal =
          totalDailyKwh > 0 ? (dailyKwh / totalDailyKwh) * 100 : 0;

        // "What if" calculation: days gained if this appliance is removed
        const kwhWithoutThis = totalDailyKwh - dailyKwh;
        const daysWithoutThis =
          kwhWithoutThis > 0 ? totalKwh / kwhWithoutThis : Infinity;
        const daysGainedIfRemoved = isFinite(daysWithoutThis)
          ? Math.max(0, daysWithoutThis - exactDays)
          : 0;

        return {
          appliance,
          dailyKwh,
          dailyCostGhs,
          percentageOfTotal,
          daysGainedIfRemoved,
        };
      })
      // Sort by daily cost descending — biggest energy hogs first
      .sort((a, b) => b.dailyCostGhs - a.dailyCostGhs);

    return {
      totalKwh,
      dailyKwh: totalDailyKwh,
      dailyCostGhs: totalDailyCostGhs,
      daysLeft,
      hoursRemainder,
      breakdown,
      tariffType,
      creditGhs,
      serviceCharge: proratedServiceCharge,
      usableCredit,
    };
  }, [creditGhs, tariffType, appliances]);
}

// ─── Utility formatters ────────────────────────────────────────────────────────

/**
 * Format a days + hours duration into a human-readable string.
 * e.g. formatDuration(4, 6) → "4 days, 6 hrs"
 *      formatDuration(0, 14) → "14 hours"
 *      formatDuration(1, 0) → "1 day"
 */
export function formatDuration(days: number, hours: number): string {
  if (!isFinite(days)) return '—';
  if (days === 0 && hours === 0) return 'Less than 1 hour';
  if (days === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
  if (hours === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}, ${hours} hr${hours !== 1 ? 's' : ''}`;
}

/**
 * Format a GHS amount: ₵1,234.56
 */
export function formatGhs(amount: number): string {
  return `₵${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format kWh with 2 decimal places: "12.45 kWh"
 */
export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

/**
 * Urgency level based on days remaining — used to colour-code the result card.
 */
export type UrgencyLevel = 'critical' | 'warning' | 'good' | 'great';

export function getUrgencyLevel(daysLeft: number): UrgencyLevel {
  if (daysLeft < 2) return 'critical';
  if (daysLeft < 5) return 'warning';
  if (daysLeft < 14) return 'good';
  return 'great';
}

/**
 * Plain-language urgency message shown under the main result.
 */
export function getUrgencyMessage(
  daysLeft: number,
  dailyCostGhs: number,
): string {
  const cost = formatGhs(dailyCostGhs);
  if (daysLeft < 1) return `Your units will finish today. You're spending ${cost} per day.`;
  if (daysLeft < 3) return `⚠️ Credit running low. At ${cost}/day, top up soon.`;
  if (daysLeft < 7) return `You have about a week. Daily spend: ${cost}.`;
  if (daysLeft < 14) return `Decent coverage. Daily spend: ${cost}.`;
  return `Your credit will last well. Daily spend: ${cost}.`;
}

/**
 * Energy-saving tip based on which appliance is the biggest cost driver.
 * Returns null if no actionable tip is available.
 */
export function getTopSavingTip(
  breakdown: ApplianceBreakdown[],
): string | null {
  if (breakdown.length === 0) return null;
  const topDrain = breakdown[0];
  const { id } = topDrain.appliance;

  const tips: Record<string, string> = {
    ac_1hp:
      'Set your AC to 24–26°C instead of 18°C. Each degree lower adds ~8% to your bill.',
    ac_1_5hp:
      'Set your AC to 24–26°C instead of 18°C. Each degree lower adds ~8% to your bill.',
    ac_2hp:
      'Set your AC to 24–26°C instead of 18°C. Each degree lower adds ~8% to your bill.',
    refrigerator:
      'Keep your fridge at 3–5°C and avoid leaving the door open. A full fridge is more efficient.',
    chest_freezer:
      'Defrost your freezer regularly — ice build-up makes it work harder.',
    electric_cooker:
      'Use a pressure cooker or gas for heavy cooking. Electric cookers are expensive per meal.',
    electric_iron:
      'Iron clothes in one batch per week and switch off as soon as you are done.',
    water_pump:
      'Fill your tank once a day instead of running the pump multiple times.',
    tv_43:
      'Reduce TV screen brightness. A 43" screen at full brightness uses ~30% more power.',
    security_light:
      'Switch to LED security lights — they use 80% less power than halogen floods.',
  };

  return tips[id] ?? null;
}