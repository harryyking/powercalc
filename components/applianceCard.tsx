/**
 * components/ApplianceCard.tsx
 *
 * Fix: cost badge moved from the header row into the info column,
 * stacked below the name. This removes the horizontal competition
 * between [emoji | name | cost badge | toggle] that caused truncation.
 *
 * Header row is now just [emoji | name + sub-row | toggle] —
 * the name gets all the flex space it needs.
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import type { ActiveAppliance, Appliance } from '../types';
import { formatGhs } from '../lib/useCalculator';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  background:        '#121212',
  surface:           '#1a1a1a',
  card:              '#171717',
  secondary:         '#242424',
  input:             '#242424',
  border:            '#292929',
  foreground:        '#e2e8f0',
  mutedForeground:   '#a2a2a2',
  primary:           '#006239',
  primaryLight:      '#00a862',
  primaryForeground: '#dde8e3',
  ring:              '#4ade80',
  amber:             '#F59E0B',

  sm: 8, md: 14, lg: 20, pill: 999,
};

interface Props {
  appliance: Appliance;
  activeAppliance?: ActiveAppliance;
  effectiveRatePerKwh: number;
  onToggle: (appliance: Appliance) => void;
  onUpdate: (id: string, changes: Partial<ActiveAppliance>) => void;
}

export default function ApplianceCard({
  appliance,
  activeAppliance,
  effectiveRatePerKwh,
  onToggle,
  onUpdate,
}: Props) {
  const isActive = !!activeAppliance;
  const hours    = activeAppliance?.hoursPerDay ?? appliance.defaultHoursPerDay;
  const quantity = activeAppliance?.quantity    ?? 1;
  const watts    = activeAppliance?.watts       ?? appliance.defaultWatts;

  const dailyKwh  = (watts * quantity * hours) / 1000;
  const dailyCost = dailyKwh * effectiveRatePerKwh;

  const [showWattEdit, setShowWattEdit] = useState(false);

  function formatHours(h: number): string {
    if (h < 1)    return `${Math.round(h * 60)} min`;
    if (h === 24) return '24 h (always on)';
    return `${h % 1 === 0 ? h : h.toFixed(1)} hr${h !== 1 ? 's' : ''}`;
  }

  return (
    <TouchableOpacity
      style={[s.card, isActive && s.cardActive]}
      onPress={() => onToggle(appliance)}
      activeOpacity={0.75}
    >
      {/* ── Header row ──────────────────────────────────────────────── */}
      {/*
        Layout: [emojiWrap] [info: flex-1] [toggleCircle]
        The cost badge lives INSIDE the info column now, never competing
        horizontally with the name for space.
      */}
      <View style={s.header}>

        {/* Emoji */}
        <View style={[s.emojiWrap, isActive && s.emojiWrapActive]}>
          <Text style={s.emoji}>{appliance.emoji}</Text>
        </View>

        {/* Name + sub-row (watts · cost badge) */}
        <View style={s.info}>
          {/* Name — no numberOfLines cap, wraps naturally if long */}
          <Text style={[s.name, isActive && s.nameActive]}>
            {appliance.name}
          </Text>

          {/* Sub-row below the name */}
          <View style={s.subRow}>
            <Text style={s.wattsLabel}>{watts}W</Text>

            {/* Cost badge: only shown when active, sits inline after watts */}
            {isActive && (
              <View style={s.costBadge}>
                <Text style={s.costText}>{formatGhs(dailyCost)}</Text>
                <Text style={s.costSub}>/day</Text>
              </View>
            )}
          </View>
        </View>

        {/* Toggle circle — fixed 26px, always at the far right */}
        <View style={[s.toggleCircle, isActive && s.toggleCircleActive]}>
          <Text style={[s.toggleIcon, isActive && s.toggleIconActive]}>
            {isActive ? '✓' : '+'}
          </Text>
        </View>

      </View>

      {/* ── Expanded controls ────────────────────────────────────────── */}
      {isActive && (
        <View style={s.controls}>

          {/* Hours slider */}
          <View style={s.labelRow}>
            <Text style={s.controlLabel}>Hours / day</Text>
            <Text style={s.controlValue}>{formatHours(hours)}</Text>
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

          {/* Bottom row: qty stepper + edit watts */}
          <View style={s.bottomRow}>
            {/* Quantity stepper */}
            <View style={s.stepperRow}>
              <Text style={s.controlLabel}>Qty</Text>
              <View style={s.stepper}>
                <TouchableOpacity
                  style={s.stepBtn}
                  onPress={() =>
                    onUpdate(appliance.id, { quantity: Math.max(1, quantity - 1) })
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.stepNum}>{quantity}</Text>
                <TouchableOpacity
                  style={s.stepBtn}
                  onPress={() =>
                    onUpdate(appliance.id, { quantity: quantity + 1 })
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Edit watts toggle */}
            <TouchableOpacity
              style={s.editWattsBtn}
              onPress={() => setShowWattEdit(!showWattEdit)}
            >
              <Text style={s.editWattsText}>
                {showWattEdit ? 'Done' : '⚡ Edit watts'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Watt override slider */}
          {showWattEdit && (
            <View style={s.wattSection}>
              <View style={s.labelRow}>
                <Text style={s.controlLabel}>Wattage</Text>
                <Text style={[s.controlValue, { color: T.amber }]}>{watts}W</Text>
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
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: T.secondary,
    borderRadius: T.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardActive: {
    backgroundColor: T.card,
    borderColor: T.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',   // vertically centre all three columns
    gap: 10,
  },

  emojiWrap: {
    width: 38,
    height: 38,
    borderRadius: T.sm,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
    // flex-shrink: 0 is the default — it will never compress
  },
  emojiWrapActive: {
    borderColor: T.primary,
    backgroundColor: 'rgba(0, 98, 57, 0.15)',
  },
  emoji: {
    fontSize: 19,
  },

  // info column stretches to fill all remaining horizontal space
  info: {
    flex: 1,
    gap: 4,
    // No minWidth/maxWidth needed — flex: 1 + no siblings with flex
    // means this always gets exactly the available space.
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: T.mutedForeground,
    // Removed numberOfLines={1} — name now wraps to a second line
    // rather than truncating. Most names are ≤ 20 chars so this
    // rarely wraps, but "Air Conditioner" etc. will show in full.
  },
  nameActive: {
    color: T.foreground,
    fontWeight: '600',
  },

  // Sub-row sits below the name: [watts] [cost badge?]
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',   // in case both are wide on a small device
  },
  wattsLabel: {
    fontSize: 11,
    color: T.mutedForeground,
    opacity: 0.7,
  },

  // Cost badge — now in the sub-row, not the header row
  costBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    backgroundColor: 'rgba(0, 98, 57, 0.25)',
    borderRadius: T.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: T.primary,
  },
  costText: {
    color: T.ring,
    fontSize: 11,
    fontWeight: '700',
  },
  costSub: {
    color: T.primaryLight,
    fontSize: 9,
  },

  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,   // never compress — always 26×26
  },
  toggleCircleActive: {
    backgroundColor: T.primary,
    borderColor: T.primaryLight,
  },
  toggleIcon: {
    fontSize: 13,
    color: T.mutedForeground,
    lineHeight: 15,
  },
  toggleIconActive: {
    color: T.primaryForeground,
    fontWeight: '700',
  },

  // ── Controls ──────────────────────────────────────────────────────────────
  controls: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 2,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  controlLabel: {
    fontSize: 11,
    color: T.mutedForeground,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  controlValue: {
    fontSize: 12,
    fontWeight: '700',
    color: T.primaryLight,
  },

  slider: {
    width: '100%',
    height: 32,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.sm,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.card,
  },
  stepBtnText: {
    fontSize: 17,
    color: T.primaryLight,
    fontWeight: '400',
    lineHeight: 20,
  },
  stepNum: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: T.foreground,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: T.border,
    paddingVertical: 5,
  },

  editWattsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.pill,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  editWattsText: {
    fontSize: 11,
    color: T.mutedForeground,
    fontWeight: '500',
  },

  wattSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
});