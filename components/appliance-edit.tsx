/**
 * components/ApplianceEditSheet.tsx
 *
 * Full-width bottom sheet for configuring a single active appliance.
 * Requires @gorhom/bottom-sheet (peer dep: react-native-reanimated).
 *
 * Shows live daily-cost in the header so the user sees the impact
 * of every slider move in real time.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Text from '@/components/Text';
import type { ActiveAppliance, Appliance } from '../types';
import { formatGhs } from '../lib/useCalculator';
import { THEME } from '@/lib/theme';

const T = THEME.colors;
const S = THEME.radius;

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  appliance: Appliance;
  activeAppliance: ActiveAppliance;
  effectiveRatePerKwh: number;
  onUpdate: (id: string, changes: Partial<ActiveAppliance>) => void;
  /** Called when the user taps "Remove" — parent should deactivate + close */
  onRemove: () => void;
  /** Called on Done press or pan-to-dismiss */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ApplianceEditSheet({
  appliance,
  activeAppliance,
  effectiveRatePerKwh,
  onUpdate,
  onRemove,
  onClose,
}: Props) {
  const ref        = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '75%'], []);

  // Open on mount
  useEffect(() => { ref.current?.snapToIndex(0); }, []);

  const hours    = activeAppliance.hoursPerDay;
  const quantity = activeAppliance.quantity;
  const watts    = activeAppliance.watts;

  const dailyKwh  = (watts * quantity * hours) / 1000;
  const dailyCost = dailyKwh * effectiveRatePerKwh;

  function formatHours(h: number): string {
    if (h < 1)    return `${Math.round(h * 60)} min`;
    if (h === 24) return '24 h (always on)';
    return `${h % 1 === 0 ? h : h.toFixed(1)} hr${h !== 1 ? 's' : ''}`;
  }

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.emojiWrap}>
            <Text style={s.emoji}>{appliance.emoji}</Text>
          </View>

          <View style={s.headerInfo}>
            <Text style={s.applianceName}>{appliance.name}</Text>
            {/* Live cost — updates as sliders move */}
            <View style={s.liveCostRow}>
              <Ionicons name="flash" size={10} color={T.ring} />
              <Text style={s.liveCost}>{formatGhs(dailyCost)} / day</Text>
              <Text style={s.liveKwh}>· {dailyKwh.toFixed(2)} kWh</Text>
            </View>
          </View>

          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={17} color={T.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* ── Hours per day ─────────────────────────────────────────── */}
        <View style={s.block}>
          <View style={s.labelRow}>
            <Text style={s.blockLabel}>Hours per day</Text>
            <Text style={s.blockValue}>{formatHours(hours)}</Text>
          </View>
          <Slider
            style={s.slider}
            minimumValue={appliance.minHours}
            maximumValue={appliance.maxHours}
            step={appliance.stepHours}
            value={hours}
            minimumTrackTintColor={T.primaryLight}
            maximumTrackTintColor={T.border}
            thumbTintColor={T.ring}
            onValueChange={(v) =>
              onUpdate(appliance.id, { hoursPerDay: parseFloat(v.toFixed(2)) })
            }
          />
          {/* Range labels */}
          <View style={s.rangeRow}>
            <Text style={s.rangeLabel}>{formatHours(appliance.minHours)}</Text>
            <Text style={s.rangeLabel}>{formatHours(appliance.maxHours)}</Text>
          </View>
        </View>

        {/* ── Quantity ──────────────────────────────────────────────── */}
        <View style={s.block}>
          <View style={s.labelRow}>
            <View style={s.labelCol}>
              <Text style={s.blockLabel}>Quantity</Text>
              <Text style={s.blockSub}>How many units running?</Text>
            </View>
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                onPress={() =>
                  onUpdate(appliance.id, { quantity: Math.max(1, quantity - 1) })
                }
                hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
              >
                <Text style={s.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.stepNum}>{quantity}</Text>
              <TouchableOpacity
                style={s.stepBtn}
                onPress={() =>
                  onUpdate(appliance.id, { quantity: quantity + 1 })
                }
                hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
              >
                <Text style={s.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Wattage ───────────────────────────────────────────────── */}
        <View style={s.block}>
          <View style={s.labelRow}>
            <View style={s.labelCol}>
              <Text style={s.blockLabel}>Wattage</Text>
              <Text style={s.blockSub}>Adjust to match your model</Text>
            </View>
            <View style={s.wattBadge}>
              <Text style={s.wattBadgeText}>{watts}W</Text>
            </View>
          </View>
          <Slider
            style={s.slider}
            minimumValue={1}
            maximumValue={appliance.defaultWatts * 2}
            step={1}
            value={watts}
            minimumTrackTintColor={T.amber}
            maximumTrackTintColor={T.border}
            thumbTintColor={T.amber}
            onValueChange={(v) =>
              onUpdate(appliance.id, { watts: Math.round(v) })
            }
          />
          <View style={s.rangeRow}>
            <Text style={s.rangeLabel}>1W</Text>
            <Text style={s.rangeLabel}>
              {appliance.defaultWatts * 2}W (default ×2)
            </Text>
          </View>
        </View>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.removeBtn}
            onPress={onRemove}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={14} color={T.warning} />
            <Text style={s.removeBtnText}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.doneBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={15} color={T.primaryForeground} />
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: T.surface,
  },
  handle: {
    backgroundColor: T.border,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: S.md,
    backgroundColor: 'rgba(0, 98, 57, 0.15)',
    borderWidth: 1,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    gap: 5,
  },
  applianceName: {
    fontSize: 18,
    fontWeight: '700',
    color: T.foreground,
    letterSpacing: -0.3,
  },
  liveCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveCost: {
    fontSize: 13,
    fontWeight: '700',
    color: T.ring,
  },
  liveKwh: {
    fontSize: 11,
    color: T.mutedForeground,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.secondary,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  divider: {
    height: 1,
    backgroundColor: T.border,
    marginBottom: 20,
  },

  // ── Control block ─────────────────────────────────────────────────────────
  block: {
    marginBottom: 24,
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: T.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  blockSub: {
    fontSize: 11,
    color: T.mutedForeground,
    opacity: 0.6,
  },
  blockValue: {
    fontSize: 15,
    fontWeight: '700',
    color: T.primaryLight,
  },
  slider: {
    width: '100%',
    height: 38,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  rangeLabel: {
    fontSize: 10,
    color: T.mutedForeground,
    opacity: 0.5,
  },

  // Watt badge
  wattBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: S.pill,
    borderWidth: 1,
    borderColor: T.amber,
  },
  wattBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.amber,
  },

  // ── Stepper ───────────────────────────────────────────────────────────────
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: S.sm,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    color: T.primaryLight,
    fontWeight: '300',
    lineHeight: 22,
  },
  stepNum: {
    minWidth: 38,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: T.foreground,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: T.border,
    paddingVertical: 7,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: S.md,
    backgroundColor: T.secondary,
    borderWidth: 1,
    borderColor: T.warning,
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.warning,
  },
  doneBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: S.md,
    backgroundColor: T.primary,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.primaryForeground,
  },
});