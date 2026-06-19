/**
 * components/ApplianceSheet.tsx
 *
 * Native pageSheet Modal that opens over the main screen.
 * Contains:
 *   – Tariff selector (collapsible)
 *   – 2-col compact appliance grid
 *   – Show more / less toggle
 *   – Individual appliance config via ApplianceEditSheet (formSheet on top)
 *
 * No @gorhom/bottom-sheet — uses React Native's built-in Modal.
 * presentationStyle="pageSheet" gives the native iOS sheet appearance.
 * On Android it slides up as a full-screen modal.
 */

import React, { useCallback, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '@/components/Text';


import { POPULAR_APPLIANCES, ALL_APPLIANCES } from '@/lib/appliance';
import { TARIFFS, formatRate } from '../constants/tariffs';
import type { ActiveAppliance, Appliance, TariffType } from '../types';
import { THEME } from '@/lib/theme';
import ApplianceCard from './applianceCard';
import ApplianceEditSheet from './appliance-edit';

const T = THEME.colors;
const S = THEME.radius;
const TARIFF_OPTIONS: TariffType[] = ['residential', 'lifeline', 'business'];

interface Props {
  visible: boolean;
  activeAppliances: ActiveAppliance[];
  effectiveRatePerKwh: number;
  tariffType: TariffType;
  onToggle: (appliance: Appliance) => void;
  onUpdate: (id: string, changes: Partial<ActiveAppliance>) => void;
  onTariffChange: (t: TariffType) => void;
  onClose: () => void;
}

export default function ApplianceSheet({
  visible,
  activeAppliances,
  effectiveRatePerKwh,
  tariffType,
  onToggle,
  onUpdate,
  onTariffChange,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  const [showAll, setShowAll]               = useState(false);
  const [showTariff, setShowTariff]         = useState(false);
  const [editingAppliance, setEditing]      = useState<Appliance | null>(null);

  const displayed = showAll ? ALL_APPLIANCES : POPULAR_APPLIANCES;

  // Card-body press: add if not active, then open edit sheet
  const handleCardPress = useCallback((appliance: Appliance) => {
    if (!activeAppliances.find(a => a.id === appliance.id)) {
      onToggle(appliance);
    }
    setEditing(appliance);
  }, [activeAppliances, onToggle]);

  const activeCount = activeAppliances.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>

        {/* ── Sheet handle + header ───────────────────────────────── */}
        <View style={s.handleBar}>
          <View style={s.handle} />
        </View>

        <View style={s.sheetHeader}>
          <View style={s.sheetHeaderLeft}>
            <Text style={s.sheetTitle}>Select Appliances</Text>
            {activeCount > 0 && (
              <View style={s.countBadge}>
                <View style={s.countDot} />
                <Text style={s.countText}>{activeCount} selected</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tariff selector ─────────────────────────────────────── */}
        <View style={s.tariffWrapper}>
          <Pressable style={s.tariffRow} onPress={() => setShowTariff(v => !v)}>
            <Ionicons name="flash-outline" size={13} color={T.mutedForeground} />
            <Text style={s.tariffRowLabel}>
              Tariff:{' '}
              <Text style={s.tariffRowValue}>{TARIFFS[tariffType].label}</Text>
              {' '}· {formatRate(tariffType)}
            </Text>
            <Ionicons
              name={showTariff ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={T.mutedForeground}
            />
          </Pressable>

          {showTariff && (
            <Animated.View entering={FadeInDown} style={s.tariffPicker}>
              {TARIFF_OPTIONS.map(t => {
                const active = tariffType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[s.tariffOption, active && s.tariffOptionActive]}
                    onPress={() => { onTariffChange(t); setShowTariff(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={s.tariffOptionLeft}>
                      {active && <View style={s.tariffDot} />}
                      <Text style={[s.tariffOptionLabel, active && s.tariffOptionLabelActive]}>
                        {TARIFFS[t].label}
                      </Text>
                    </View>
                    <Text style={[s.tariffOptionRate, active && s.tariffOptionRateActive]}>
                      {formatRate(t)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
        </View>

        <View style={s.divider} />

        {/* ── Section label ───────────────────────────────────────── */}
        <View style={s.gridLabel}>
          <Text style={s.gridLabelText}>
            {showAll ? 'All appliances' : 'Popular appliances'}
          </Text>
          <Text style={s.gridLabelSub}>
            Tap to add · Tap active card to configure
          </Text>
        </View>

        {/* ── Appliance grid ──────────────────────────────────────── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.gridInner}>
            {displayed.map(appliance => (
              <ApplianceCard
                key={appliance.id}
                appliance={appliance}
                activeAppliance={activeAppliances.find(a => a.id === appliance.id)}
                effectiveRatePerKwh={effectiveRatePerKwh}
                onToggle={onToggle}
                onCardPress={handleCardPress}
              />
            ))}
          </View>

          {/* Show more / less */}
          <TouchableOpacity
            style={s.showMoreBtn}
            onPress={() => setShowAll(v => !v)}
            activeOpacity={0.7}
          >
            <Text style={s.showMoreText}>
              {showAll ? 'Show popular only' : 'Show all appliances'}
            </Text>
            <Ionicons
              name={showAll ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={T.primaryLight}
            />
          </TouchableOpacity>
        </ScrollView>

      </View>

      {/* ── ApplianceEditSheet — formSheet Modal on top ──────────── */}
      {editingAppliance && (() => {
        const active = activeAppliances.find(a => a.id === editingAppliance.id);
        if (!active) return null;
        return (
          <ApplianceEditSheet
            appliance={editingAppliance}
            activeAppliance={active}
            effectiveRatePerKwh={effectiveRatePerKwh}
            onUpdate={onUpdate}
            onRemove={() => {
              onToggle(editingAppliance);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        );
      })()}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.background,
  },

  // ── Handle + header ───────────────────────────────────────────────────────
  handleBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: T.foreground },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.ringDim, borderWidth: 1, borderColor: T.ringBorder,
    borderRadius: S.pill, paddingHorizontal: 9, paddingVertical: 3,
  },
  countDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: T.ring },
  countText: { fontSize: 11, fontWeight: '600', color: T.ring },
  doneBtn: {
    backgroundColor: T.primary, borderRadius: S.pill,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  doneBtnText: { fontSize: 13, fontWeight: '700', color: T.primaryForeground },

  // ── Tariff ────────────────────────────────────────────────────────────────
  tariffWrapper: { paddingHorizontal: 16, paddingBottom: 4 },
  tariffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10,
  },
  tariffRowLabel: { flex: 1, fontSize: 12, color: T.mutedForeground },
  tariffRowValue: { color: T.foreground, fontWeight: '600' },
  tariffPicker: {
    borderRadius: S.md, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.secondary, overflow: 'hidden', marginBottom: 4,
  },
  tariffOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  tariffOptionActive: { backgroundColor: 'rgba(0,98,57,0.12)' },
  tariffOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tariffDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.primaryLight },
  tariffOptionLabel: { fontSize: 13, fontWeight: '500', color: T.mutedForeground },
  tariffOptionLabelActive: { color: T.foreground, fontWeight: '600' },
  tariffOptionRate: { fontSize: 12, color: T.mutedForeground },
  tariffOptionRateActive: { color: T.primaryLight, fontWeight: '600' },

  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 0 },

  // ── Grid label ────────────────────────────────────────────────────────────
  gridLabel: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 2,
  },
  gridLabelText: {
    fontSize: 11, fontWeight: '700', color: T.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 0.9,
  },
  gridLabelSub: { fontSize: 11, color: T.mutedForeground, opacity: 0.55 },

  // ── Grid ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  grid:   { paddingHorizontal: 16, paddingTop: 4 },
  gridInner: {
    flexDirection: 'column',  
  },

  // ── Show more ─────────────────────────────────────────────────────────────
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12, marginTop: 4,
    borderRadius: S.md, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.secondary,
  },
  showMoreText: { fontSize: 12, color: T.primaryLight, fontWeight: '500' },
});