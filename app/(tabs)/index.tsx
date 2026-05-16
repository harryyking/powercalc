/**
 * app/(tabs)/index.tsx — Calculator Screen (Home Tab)
 *
 * Redesigned with a clean 3-step linear flow:
 *   Step 1 → Enter credit amount
 *   Step 2 → Pick appliances (2-col grid)
 *   Step 3 → See inline results + sticky summary bar
 *
 * BottomSheet removed entirely. No floating/absolute result views.
 * Tariff picker collapsed behind a small link by default.
 */

import React, { useCallback, useState } from 'react';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Pressable,
} from 'react-native';
import Text from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ApplianceCard from '@/components/applianceCard';
import ResultCard from '@/components/resultCard';
import { POPULAR_APPLIANCES, ALL_APPLIANCES } from '@/lib/appliance';
import { TARIFFS, formatRate } from '../../constants/tariffs';
import { useCalculator } from '../../lib/useCalculator';
import { addHistoryEntry, generateId } from '../../lib/historyStore';
import type { ActiveAppliance, Appliance, TariffType } from '../../types';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  background:          '#0e0e0e',
  surface:             '#161616',
  surfaceElevated:     '#1c1c1c',
  card:                '#131313',
  foreground:          '#e8eae8',
  onBackground:        '#8a8a8a',
  primary:             '#006239',
  primaryLight:        '#00a862',
  primaryForeground:   '#dde8e3',
  accent:              '#2a2a2a',
  secondary:           '#1e1e1e',
  secondaryForeground: '#9a9a9a',
  muted:               '#1c1c1c',
  mutedForeground:     '#606060',
  border:              '#242424',
  input:               '#191919',
  ring:                '#3ecf6e',
  ringDim:             'rgba(62,207,110,0.12)',
  ringBorder:          'rgba(62,207,110,0.22)',
  warning:             '#f59e0b',
  blue:                '#3b82f6',
  blueDim:             'rgba(59,130,246,0.08)',
  blueBorder:          'rgba(59,130,246,0.18)',

  // Radii
  sm:   6,
  md:   12,
  lg:   18,
  xl:   24,
  pill: 999,
};

const TARIFF_OPTIONS: TariffType[] = ['residential', 'lifeline', 'business'];

// ─── Step label component ─────────────────────────────────────────────────────
function StepLabel({
  number,
  label,
  done,
}: {
  number: number;
  label: string;
  done?: boolean;
}) {
  return (
    <View style={step.row}>
      <View style={[step.circle, done && step.circleDone]}>
        {done ? (
          <Ionicons name="checkmark" size={10} color={T.background} />
        ) : (
          <Text style={step.num}>{number}</Text>
        )}
      </View>
      <Text style={[step.label, done && step.labelDone]}>{label}</Text>
    </View>
  );
}

const step = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.secondary,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: T.primaryLight,
    borderColor: T.primaryLight,
  },
  num: {
    fontSize: 10,
    fontWeight: '700',
    color: T.mutedForeground,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelDone: {
    color: T.primaryLight,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [creditText, setCreditText]             = useState('50');
  const [tariffType, setTariffType]             = useState<TariffType>('residential');
  const [showTariffPicker, setShowTariffPicker] = useState(false);
  const [activeAppliances, setActiveAppliances] = useState<ActiveAppliance[]>([]);
  const [showAllAppliances, setShowAllAppliances] = useState(false);
  const [savedToast, setSavedToast]             = useState(false);

  const creditGhs = parseFloat(creditText) || 0;

  // ── Calculation ───────────────────────────────────────────────────────────
  const result = useCalculator(creditGhs, tariffType, activeAppliances);

  const effectiveRate =
    result && result.totalKwh > 0
      ? result.usableCredit / result.totalKwh
      : 1.9688;

  // ── Appliance toggle / update ─────────────────────────────────────────────
  const handleToggle = useCallback((appliance: Appliance) => {
    setActiveAppliances((prev) => {
      const exists = prev.find((a) => a.id === appliance.id);
      if (exists) return prev.filter((a) => a.id !== appliance.id);
      return [
        ...prev,
        {
          ...appliance,
          watts: appliance.defaultWatts,
          hoursPerDay: appliance.defaultHoursPerDay,
          quantity: 1,
        },
      ];
    });
  }, []);

  const handleUpdate = useCallback(
    (id: string, changes: Partial<ActiveAppliance>) =>
      setActiveAppliances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...changes } : a)),
      ),
    [],
  );

  // ── Save to history ───────────────────────────────────────────────────────
  const handleSave = () => {
    if (!result) return;
    addHistoryEntry({
      id: generateId(),
      date: new Date().toISOString(),
      creditGhs,
      tariffType,
      estimatedDays: result.daysLeft,
      appliances: activeAppliances,
      dailyCostGhs: result.dailyCostGhs,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const displayedAppliances = showAllAppliances ? ALL_APPLIANCES : POPULAR_APPLIANCES;
  const hasResult = !!result && activeAppliances.length > 0 && creditGhs > 0;
  const step1Done = creditGhs > 0;
  const step2Done = activeAppliances.length > 0;

  // Days-remaining urgency colour
  const daysColor =
    hasResult
      ? result.daysLeft <= 3
        ? T.warning
        : result.daysLeft <= 7
        ? '#f0b429'
        : T.ring
      : T.ring;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={T.background} />

      {/* ── Saved toast — top of screen ───────────────────────────────── */}
      {savedToast && (
        <Animated.View
          entering={FadeInDown}
          style={[s.toastBanner, { top: insets.top + 12 }]}
        >
          <Ionicons name="checkmark-circle" size={15} color={T.ring} />
          <Text style={s.toastBannerText}>Saved to history</Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.content,
            // Reserve space for the sticky result bar when results exist
            { paddingBottom: insets.bottom + (hasResult ? 88 : 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ────────────────── HEADER ────────────────────────────────── */}
          <View style={[s.header, { paddingTop: insets.top + 16 }]}>
            {/* Decorative dots */}
            <View style={s.headerDots} pointerEvents="none">
              {Array.from({ length: 24 }).map((_, i) => (
                <View key={i} style={s.dot} />
              ))}
            </View>

            <View style={s.headerBadge}>
              <Ionicons name="flash" size={10} color={T.ring} />
              <Text style={s.headerBadgeText}>ECG Prepaid</Text>
            </View>
            <Text style={s.appName}>PowerCalc GH</Text>
            <Text style={s.appTagline}>
              Know exactly how long your credit lasts
            </Text>
          </View>

          {/* ────────────────── STEP 1 · CREDIT ──────────────────────── */}
          <View style={s.section}>
            <StepLabel number={1} label="How much credit?" done={step1Done} />

            <View style={s.creditBox}>
              <View style={s.creditInputRow}>
                <Text style={s.currencySymbol}>₵</Text>
                <TextInput
                  style={s.creditInput}
                  value={creditText}
                  onChangeText={setCreditText}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor={T.mutedForeground}
                  maxLength={8}
                  selectionColor={T.ring}
                />
              </View>

              {/* Quick pills */}
              <View style={s.quickAmounts}>
                {[20, 50, 100, 200, 500].map((amt) => {
                  const active = creditGhs === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[s.quickPill, active && s.quickPillActive]}
                      onPress={() => setCreditText(String(amt))}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.quickPillText,
                          active && s.quickPillTextActive,
                        ]}
                      >
                        ₵{amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Tariff — collapsed by default ─────────────────────── */}
            <View style={s.tariffWrapper}>
              <Pressable
                onPress={() => setShowTariffPicker((v) => !v)}
                style={s.tariffToggleRow}
              >
                <Ionicons
                  name="flash-outline"
                  size={13}
                  color={T.mutedForeground}
                />
                <Text style={s.tariffToggleLabel}>
                  Tariff:{' '}
                  <Text style={s.tariffToggleValue}>
                    {TARIFFS[tariffType].label}
                  </Text>{' '}
                  · {formatRate(tariffType)}
                </Text>
                <Ionicons
                  name={showTariffPicker ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={T.mutedForeground}
                />
              </Pressable>

              {showTariffPicker && (
                <Animated.View entering={FadeInDown} style={s.tariffPicker}>
                  {TARIFF_OPTIONS.map((t) => {
                    const active = tariffType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          s.tariffOption,
                          active && s.tariffOptionActive,
                        ]}
                        onPress={() => {
                          setTariffType(t);
                          setShowTariffPicker(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={s.tariffOptionLeft}>
                          {active && (
                            <View style={s.tariffActiveDot} />
                          )}
                          <Text
                            style={[
                              s.tariffOptionLabel,
                              active && s.tariffOptionLabelActive,
                            ]}
                          >
                            {TARIFFS[t].label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            s.tariffOptionRate,
                            active && s.tariffOptionRateActive,
                          ]}
                        >
                          {formatRate(t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              )}
            </View>
          </View>

          {/* ────────────────── STEP 2 · APPLIANCES ──────────────────── */}
          <View
            style={[
              s.section,
              !step1Done && s.sectionDisabled,
            ]}
          >
            <View style={s.stepHeaderRow}>
              <StepLabel
                number={2}
                label="What are you running?"
                done={step2Done}
              />
              {step2Done && (
                <View style={s.activeBadge}>
                  <View style={s.activeDot} />
                  <Text style={s.activeBadgeText}>
                    {activeAppliances.length} selected
                  </Text>
                </View>
              )}
            </View>

            {!step1Done && (
              <View style={s.disabledOverlay}>
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color={T.mutedForeground}
                />
                <Text style={s.disabledText}>Enter credit amount first</Text>
              </View>
            )}

            {step1Done && (
              <>
                {/* 2-column appliance grid */}
                <View style={s.applianceGrid}>
                  {displayedAppliances.map((appliance) => (
                    <ApplianceCard
                      key={appliance.id}
                      appliance={appliance}
                      activeAppliance={activeAppliances.find(
                        (a) => a.id === appliance.id,
                      )}
                      effectiveRatePerKwh={effectiveRate}
                      onToggle={handleToggle}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </View>

                {/* Show more / less toggle */}
                <TouchableOpacity
                  onPress={() => setShowAllAppliances(!showAllAppliances)}
                  style={s.showMoreBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.showMoreText}>
                    {showAllAppliances
                      ? 'Show popular only'
                      : `Show all appliances`}
                  </Text>
                  <Ionicons
                    name={showAllAppliances ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={T.primaryLight}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ────────────────── STEP 3 · RESULTS ─────────────────────── */}
          {hasResult && (
            <Animated.View
              entering={FadeInUp.duration(400)}
              layout={Layout.springify()}
              style={s.section}
            >
              <StepLabel number={3} label="Your estimate" done />

              {/* Main result card */}
              <ResultCard result={result} onSave={handleSave} />

              {/* Per-appliance breakdown */}
              <Text style={s.breakdownHeading}>Daily breakdown</Text>

              {activeAppliances.map((a) => {
                const dailyKwh =
                  (a.watts * a.hoursPerDay * a.quantity) / 1000;
                const dailyCost = dailyKwh * effectiveRate;
                const pct =
                  result.dailyCostGhs > 0
                    ? (dailyCost / result.dailyCostGhs) * 100
                    : 0;

                return (
                  <Animated.View
                    key={a.id}
                    entering={FadeIn.delay(60)}
                    layout={Layout.springify()}
                    style={s.breakdownRow}
                  >
                    <View style={s.breakdownLeft}>
                      <Text style={s.breakdownName}>{a.name}</Text>
                      <Text style={s.breakdownMeta}>
                        {a.quantity}× · {a.watts}W · {a.hoursPerDay}h/day
                      </Text>
                      {/* Usage bar */}
                      <View style={s.usageBarBg}>
                        <View
                          style={[
                            s.usageBarFill,
                            { width: `${Math.min(pct, 100)}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={s.breakdownRight}>
                      <Text style={s.breakdownCost}>
                        ₵{dailyCost.toFixed(2)}
                      </Text>
                      <Text style={s.breakdownCostLabel}>/day</Text>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Save button */}
              <TouchableOpacity
                style={s.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={15}
                  color={T.foreground}
                />
                <Text style={s.saveBtnText}>Save to history</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Hint when credit entered but no appliances ─────────── */}
          {step1Done && !step2Done && (
            <Animated.View entering={FadeIn} style={s.hint}>
              <Ionicons name="bulb-outline" size={16} color="#60A5FA" />
              <Text style={s.hintText}>
                Tap an appliance above to see how long ₵{creditGhs} will last
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* ────────────────── STICKY RESULT BAR ────────────────────────
            Only visible when there is a valid result. Sits above the
            tab bar. Gives users a persistent headline without scrolling.
        ──────────────────────────────────────────────────────────────── */}
        {hasResult && (
          <Animated.View
            entering={FadeInUp.duration(350)}
            style={[s.stickyBar, { paddingBottom: insets.bottom + 12 }]}
          >
            <View style={s.stickyLeft}>
              <Text style={s.stickyLabel}>₵{creditGhs} lasts</Text>
              <Text style={[s.stickyDays, { color: daysColor }]}>
                ~{result.daysLeft}{' '}
                <Text style={s.stickyDaysUnit}>
                  day{result.daysLeft !== 1 ? 's' : ''}
                </Text>
              </Text>
            </View>
            <View style={s.stickyRight}>
              <Text style={s.stickyRateLabel}>Daily cost</Text>
              <Text style={s.stickyRate}>
                ₵{result.dailyCostGhs.toFixed(2)}
              </Text>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 0,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: T.card,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    overflow: 'hidden',
  },
  headerDots: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    opacity: 0.2,
    padding: 14,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: T.primaryLight,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.ringDim,
    borderWidth: 1,
    borderColor: T.ringBorder,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: T.pill,
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: T.ring,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: T.foreground,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 12,
    color: T.mutedForeground,
    marginTop: 3,
  },

  // ── Sections ────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  sectionDisabled: {
    opacity: 0.45,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  disabledText: {
    fontSize: 12,
    color: T.mutedForeground,
    fontStyle: 'italic',
  },

  // ── Credit input ────────────────────────────────────────────────────────
  creditBox: {
    backgroundColor: T.input,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    gap: 12,
  },
  creditInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '300',
    color: T.mutedForeground,
  },
  creditInput: {
    flex: 1,
    fontSize: 44,
    fontWeight: '700',
    color: T.foreground,
    padding: 0,
    letterSpacing: -1.5,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.secondary,
  },
  quickPillActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: T.mutedForeground,
  },
  quickPillTextActive: {
    color: T.primaryForeground,
    fontWeight: '700',
  },

  // ── Tariff ──────────────────────────────────────────────────────────────
  tariffWrapper: {
    gap: 0,
  },
  tariffToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  tariffToggleLabel: {
    flex: 1,
    fontSize: 12,
    color: T.mutedForeground,
  },
  tariffToggleValue: {
    color: T.foreground,
    fontWeight: '600',
  },
  tariffPicker: {
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.secondary,
    overflow: 'hidden',
    marginTop: 4,
  },
  tariffOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tariffOptionActive: {
    backgroundColor: 'rgba(0,98,57,0.12)',
  },
  tariffOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tariffActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primaryLight,
  },
  tariffOptionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: T.mutedForeground,
  },
  tariffOptionLabelActive: {
    color: T.foreground,
    fontWeight: '600',
  },
  tariffOptionRate: {
    fontSize: 12,
    color: T.mutedForeground,
  },
  tariffOptionRateActive: {
    color: T.primaryLight,
    fontWeight: '600',
  },

  // ── Appliance grid ──────────────────────────────────────────────────────
  applianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.secondary,
  },
  showMoreText: {
    fontSize: 12,
    color: T.primaryLight,
    fontWeight: '500',
  },

  // ── Active badge ────────────────────────────────────────────────────────
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: T.ringDim,
    borderWidth: 1,
    borderColor: T.ringBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: T.pill,
    marginBottom: 14,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: T.ring,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.ring,
  },

  // ── Hint ────────────────────────────────────────────────────────────────
  hint: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    backgroundColor: T.blueDim,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.blueBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#93C5FD',
    lineHeight: 19,
  },

  // ── Breakdown ───────────────────────────────────────────────────────────
  breakdownHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: T.secondary,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  breakdownLeft: {
    flex: 1,
    gap: 3,
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '600',
    color: T.foreground,
  },
  breakdownMeta: {
    fontSize: 11,
    color: T.mutedForeground,
  },
  usageBarBg: {
    height: 3,
    backgroundColor: T.border,
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: 3,
    backgroundColor: T.primaryLight,
    borderRadius: 2,
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  breakdownCost: {
    fontSize: 15,
    fontWeight: '700',
    color: T.primaryLight,
  },
  breakdownCostLabel: {
    fontSize: 11,
    color: T.mutedForeground,
  },

  // ── Save button ─────────────────────────────────────────────────────────
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.secondary,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.md,
    paddingVertical: 13,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.foreground,
  },

  // ── Toast banner (top) ──────────────────────────────────────────────────
  toastBanner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.ringBorder,
    borderRadius: T.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.ring,
  },

  // ── Sticky result bar ────────────────────────────────────────────────────
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  stickyLeft: {
    gap: 1,
  },
  stickyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stickyDays: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  stickyDaysUnit: {
    fontSize: 16,
    fontWeight: '500',
  },
  stickyRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  stickyRateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stickyRate: {
    fontSize: 22,
    fontWeight: '700',
    color: T.foreground,
    letterSpacing: -0.5,
  },
});