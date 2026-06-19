/**
 * app/(tabs)/index.tsx
 *
 * Result-first layout matching wireframe:
 *   ① Hero result board  ("33 Days")
 *   ② Price estimation card
 *   ③ Appliances selector button  → opens ApplianceSheet (pageSheet Modal)
 *   ④ Save button
 *
 * Credit input lives in a compact section above the board.
 * All appliance picking + tariff config happens inside ApplianceSheet.
 * No @gorhom/bottom-sheet required on this screen.
 */

import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


import { TARIFFS } from '../../constants/tariffs';
import { useCalculator } from '../../lib/useCalculator';
import { addHistoryEntry, generateId } from '../../lib/historyStore';
import type { ActiveAppliance, Appliance, TariffType } from '../../types';
import { THEME } from '@/lib/theme';
import ApplianceSheet from '@/components/applianceSheet';

const T = THEME.colors;
const S = THEME.radius;

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();

  const [creditText, setCreditText]     = useState('50');
  const [tariffType, setTariffType]     = useState<TariffType>('residential');
  const [activeAppliances, setActive]   = useState<ActiveAppliance[]>([]);
  const [showSheet, setShowSheet]       = useState(false);
  const [savedToast, setSavedToast]     = useState(false);

  const creditGhs = parseFloat(creditText) || 0;
  const result    = useCalculator(creditGhs, tariffType, activeAppliances);

  const effectiveRate =
    result && result.totalKwh > 0 ? result.usableCredit / result.totalKwh : 1.9688;

  // ── Appliance handlers ────────────────────────────────────────────────────
  const handleToggle = useCallback((appliance: Appliance) => {
    setActive(prev => {
      const exists = prev.find(a => a.id === appliance.id);
      if (exists) return prev.filter(a => a.id !== appliance.id);
      return [...prev, {
        ...appliance,
        watts: appliance.defaultWatts,
        hoursPerDay: appliance.defaultHoursPerDay,
        quantity: 1,
      }];
    });
  }, []);

  const handleUpdate = useCallback(
    (id: string, changes: Partial<ActiveAppliance>) =>
      setActive(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a)),
    [],
  );

  // ── Save ──────────────────────────────────────────────────────────────────
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

  const hasResult = !!result && activeAppliances.length > 0 && creditGhs > 0;

  const daysColor = hasResult
    ? result.daysLeft <= 3  ? T.warning
    : result.daysLeft <= 7  ? '#f0b429'
    : T.ring
    : T.ring;

  return (
    <>
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {savedToast && (
        <Animated.View entering={FadeInDown} style={[s.toast, { top: insets.top + 12 }]}>
          <Ionicons name="checkmark-circle" size={15} color={T.ring} />
          <Text style={s.toastText}>Saved to history</Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <View style={[s.header, { paddingTop: insets.top + 14 }]}>
            <View style={s.headerDots} pointerEvents="none">
              {Array.from({ length: 24 }).map((_, i) => <View key={i} style={s.dot} />)}
            </View>
            <View style={s.headerRow}>
              <View>
                <View style={s.ecgBadge}>
                  <Ionicons name="flash" size={9} color={T.ring} />
                  <Text style={s.ecgBadgeText}>ECG Prepaid</Text>
                </View>
                <Text style={s.appName}>ECG Calculator</Text>
              </View>
              {/* Compact tariff label — change happens inside ApplianceSheet */}
              <View style={s.tariffPill}>
                <Text style={s.tariffPillText}>{TARIFFS[tariffType].label}</Text>
              </View>
            </View>
          </View>

          {/* ── CREDIT INPUT ────────────────────────────────────────── */}
          <View style={s.creditSection}>
            <Text style={s.creditSectionLabel}>How much credit?</Text>
            <View style={s.creditBox}>
              <View style={s.creditRow}>
                <Text style={s.cedis}>₵</Text>
                <TextInput
                  style={s.creditInput}
                  value={creditText}
                  onChangeText={setCreditText}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={T.mutedForeground}
                  maxLength={8}
                  selectionColor={T.ring}
                />
              </View>
              <View style={s.pills}>
                {[20, 50, 100, 200, 500].map(amt => {
                  const on = creditGhs === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[s.pill, on && s.pillActive]}
                      onPress={() => setCreditText(String(amt))}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pillText, on && s.pillTextActive]}>₵{amt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── RESULT BOARD ────────────────────────────────────────── */}
          <View style={s.board}>
            {hasResult ? (
              <Animated.View entering={FadeIn} layout={Layout.springify()} style={s.boardActive}>
                <Text style={s.boardLabel}>YOUR CREDIT WILL LAST</Text>
                <View style={s.boardDaysRow}>
                  <Text style={[s.boardDaysNum, { color: daysColor }]}>
                    {result.daysLeft}
                  </Text>
                  <Text style={[s.boardDaysWord, { color: daysColor }]}>
                    {result.daysLeft !== 1 ? 'days' : 'day'}
                  </Text>
                </View>
                <View style={s.boardChips}>
                  <View style={s.boardChipGreen}>
                    <Ionicons name="flash" size={9} color={T.ring} />
                    <Text style={s.boardChipGreenText}>
                      ₵{result.dailyCostGhs.toFixed(2)}/day
                    </Text>
                  </View>
                  <View style={s.boardChipMuted}>
                    <Text style={s.boardChipMutedText}>
                      {result.totalKwh.toFixed(2)} kWh/day
                    </Text>
                  </View>
                  {result.daysLeft <= 7 && (
                    <View style={[s.boardChipWarn, { borderColor: daysColor }]}>
                      <Ionicons name="warning-outline" size={9} color={daysColor} />
                      <Text style={[s.boardChipWarnText, { color: daysColor }]}>Low</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ) : (
              <View style={s.boardEmpty}>
                <View style={s.boardEmptyIcon}>
                  <Ionicons name="flash-outline" size={28} color={T.mutedForeground} />
                </View>
                <Text style={s.boardEmptyTitle}>
                  {creditGhs > 0 ? 'Add your appliances' : 'Enter a credit amount'}
                </Text>
                <Text style={s.boardEmptyBody}>
                  {creditGhs > 0
                    ? `Tap "Select appliances" below to see how long ₵${creditGhs} lasts`
                    : 'Choose how much prepaid credit you loaded'}
                </Text>
              </View>
            )}
          </View>

          {/* ── PRICE ESTIMATION ────────────────────────────────────── */}
          {hasResult && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              layout={Layout.springify()}
              style={s.priceCard}
            >
              <View style={s.priceCardHeader}>
                <Ionicons name="receipt-outline" size={12} color={T.mutedForeground} />
                <Text style={s.priceCardTitle}>Price Estimation</Text>
                <View style={s.priceCardBadge}>
                  <Text style={s.priceCardBadgeText}>
                    {activeAppliances.length} item{activeAppliances.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Total */}
              <View style={s.priceTotalRow}>
                <Text style={s.priceTotalLabel}>Daily total</Text>
                <Text style={s.priceTotalValue}>₵{result.dailyCostGhs.toFixed(2)}</Text>
              </View>

              <View style={s.priceDivider} />

              {/* Per-appliance */}
              {activeAppliances.map((a, idx) => {
                const kWh  = (a.watts * a.hoursPerDay * a.quantity) / 1000;
                const cost = kWh * effectiveRate;
                const pct  = result.dailyCostGhs > 0 ? (cost / result.dailyCostGhs) * 100 : 0;
                return (
                  <View
                    key={a.id}
                    style={[s.priceRow, idx === activeAppliances.length - 1 && s.priceRowLast]}
                  >
                    <Text style={s.priceRowEmoji}>{a.emoji}</Text>
                    <View style={s.priceRowMeta}>
                      <Text style={s.priceRowName}>{a.name}</Text>
                      <Text style={s.priceRowSub}>
                        {a.quantity > 1 ? `${a.quantity}× ` : ''}{a.watts}W · {a.hoursPerDay}h/day
                      </Text>
                      <View style={s.priceBar}>
                        <View style={[s.priceBarFill, { width: `${Math.min(pct, 100)}%` as any }]} />
                      </View>
                    </View>
                    <Text style={s.priceRowCost}>₵{cost.toFixed(2)}</Text>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* ── APPLIANCES SELECTOR ─────────────────────────────────── */}
          <TouchableOpacity
            style={[s.selectorBtn, activeAppliances.length > 0 && s.selectorBtnActive]}
            onPress={() => setShowSheet(true)}
            activeOpacity={0.8}
          >
            <View style={[s.selectorIcon, activeAppliances.length > 0 && s.selectorIconActive]}>
              <Ionicons
                name={activeAppliances.length > 0 ? 'apps' : 'apps-outline'}
                size={17}
                color={activeAppliances.length > 0 ? T.ring : T.mutedForeground}
              />
            </View>
            <View style={s.selectorTextWrap}>
              <Text style={[s.selectorTitle, activeAppliances.length > 0 && s.selectorTitleActive]}>
                {activeAppliances.length > 0
                  ? `${activeAppliances.length} selected item${activeAppliances.length !== 1 ? 's' : ''}`
                  : 'Select appliances'}
              </Text>
              <Text style={s.selectorSub}>
                {activeAppliances.length > 0
                  ? 'Tap to manage your selection'
                  : "Choose what you're currently running"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={T.mutedForeground} />
          </TouchableOpacity>

          {/* ── SAVE ────────────────────────────────────────────────── */}
          {hasResult && (
            <Animated.View entering={FadeInUp.duration(350)}>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Ionicons name="bookmark-outline" size={15} color={T.foreground} />
                <Text style={s.saveBtnText}>Save to history</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── APPLIANCE SHEET (pageSheet Modal) ───────────────────────── */}
      <ApplianceSheet
        visible={showSheet}
        activeAppliances={activeAppliances}
        effectiveRatePerKwh={effectiveRate}
        tariffType={tariffType}
        onToggle={handleToggle}
        onUpdate={handleUpdate}
        onTariffChange={setTariffType}
        onClose={() => setShowSheet(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.background },
  scroll:  { flex: 1 },
  content: { gap: 12 },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.ringBorder,
    borderRadius: S.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: { fontSize: 13, fontWeight: '600', color: T.ring },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: T.card,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    overflow: 'hidden',
  },
  headerDots: {
    position: 'absolute', top: 0, right: 0,
    width: 130, height: 90,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 9, opacity: 0.2, padding: 12,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.primaryLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ecgBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.ringDim,
    borderWidth: 1, borderColor: T.ringBorder,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: S.pill, marginBottom: 6,
  },
  ecgBadgeText: { fontSize: 9, fontWeight: '700', color: T.ring, letterSpacing: 0.8, textTransform: 'uppercase' },
  appName: { fontSize: 22, fontWeight: '700', color: T.foreground, letterSpacing: -0.5 },
  tariffPill: {
    backgroundColor: T.secondary, borderWidth: 1, borderColor: T.border,
    borderRadius: S.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  tariffPillText: { fontSize: 11, fontWeight: '600', color: T.mutedForeground },

  // ── Credit input ──────────────────────────────────────────────────────────
  creditSection: {
    paddingHorizontal: 16,
    gap: 8,
  },
  creditSectionLabel: {
    fontSize: 10, fontWeight: '700', color: T.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  creditBox: {
    backgroundColor: T.card, borderRadius: S.md,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 10,
  },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cedis: { fontSize: 28, fontWeight: '300', color: T.mutedForeground },
  creditInput: {
    flex: 1, fontSize: 44, fontWeight: '700',
    color: T.foreground, padding: 0, letterSpacing: -1.5,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: S.pill, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.secondary,
  },
  pillActive: { backgroundColor: T.primary, borderColor: T.primary },
  pillText: { fontSize: 12, fontWeight: '500', color: T.mutedForeground },
  pillTextActive: { color: T.primaryForeground, fontWeight: '700' },

  // ── Result board ──────────────────────────────────────────────────────────
  board: {
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: S.lg ?? 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    minHeight: 220,
  },
  boardActive: {
    padding: 24,
    gap: 8,
    flex: 1,
  },
  boardLabel: {
    fontSize: 10, fontWeight: '700', color: T.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  boardDaysRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  boardDaysNum: {
    fontSize: 88,
    fontWeight: '800',
    lineHeight: 88,
    letterSpacing: -4,
  },
  boardDaysWord: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  boardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  boardChipGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.ringDim,
    borderWidth: 1, borderColor: T.ringBorder,
    borderRadius: S.pill, paddingHorizontal: 9, paddingVertical: 4,
  },
  boardChipGreenText: { fontSize: 11, fontWeight: '700', color: T.ring },
  boardChipMuted: {
    backgroundColor: T.secondary, borderWidth: 1, borderColor: T.border,
    borderRadius: S.pill, paddingHorizontal: 9, paddingVertical: 4,
  },
  boardChipMutedText: { fontSize: 11, color: T.mutedForeground },
  boardChipWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderWidth: 1,
    borderRadius: S.pill, paddingHorizontal: 9, paddingVertical: 4,
  },
  boardChipWarnText: { fontSize: 11, fontWeight: '700' },
  // Empty state
  boardEmpty: {
    flex: 1, minHeight: 220,
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 10,
  },
  boardEmptyIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.secondary, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  boardEmptyTitle: {
    fontSize: 15, fontWeight: '600', color: T.foreground, textAlign: 'center',
  },
  boardEmptyBody: {
    fontSize: 12, color: T.mutedForeground, textAlign: 'center', lineHeight: 18,
  },

  // ── Price estimation card ─────────────────────────────────────────────────
  priceCard: {
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: S.md,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  priceCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  priceCardTitle: {
    flex: 1, fontSize: 11, fontWeight: '700',
    color: T.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  priceCardBadge: {
    backgroundColor: T.secondary, borderRadius: S.pill,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: T.border,
  },
  priceCardBadgeText: { fontSize: 10, fontWeight: '600', color: T.mutedForeground },
  priceTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  priceTotalLabel: { fontSize: 13, fontWeight: '600', color: T.foreground },
  priceTotalValue: { fontSize: 17, fontWeight: '800', color: T.primaryLight, letterSpacing: -0.5 },
  priceDivider: { height: 1, backgroundColor: T.border, marginHorizontal: 16 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  priceRowLast: { borderBottomWidth: 0 },
  priceRowEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  priceRowMeta: { flex: 1, gap: 3 },
  priceRowName: { fontSize: 13, fontWeight: '600', color: T.foreground },
  priceRowSub: { fontSize: 11, color: T.mutedForeground },
  priceBar: { height: 3, backgroundColor: T.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  priceBarFill: { height: 3, backgroundColor: T.primaryLight, borderRadius: 2 },
  priceRowCost: { fontSize: 14, fontWeight: '700', color: T.primaryLight },

  // ── Appliances selector button ────────────────────────────────────────────
  selectorBtn: {
    marginHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.card,
    borderRadius: S.md, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  selectorBtnActive: { borderColor: T.primaryLight },
  selectorIcon: {
    width: 38, height: 38, borderRadius: S.sm,
    backgroundColor: T.secondary,
    borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  selectorIconActive: {
    backgroundColor: T.ringDim, borderColor: T.ringBorder,
  },
  selectorTextWrap: { flex: 1, gap: 2 },
  selectorTitle: { fontSize: 14, fontWeight: '600', color: T.mutedForeground },
  selectorTitleActive: { color: T.foreground },
  selectorSub: { fontSize: 11, color: T.mutedForeground, opacity: 0.7 },

  // ── Save button ───────────────────────────────────────────────────────────
  saveBtn: {
    marginHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.secondary,
    borderWidth: 1, borderColor: T.border,
    borderRadius: S.md, paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: T.foreground },
});