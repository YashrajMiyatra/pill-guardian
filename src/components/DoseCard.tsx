import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, X, Clock, RotateCcw } from 'lucide-react-native';
import { DoseItem, DoseStatus } from '../types';
import { Colors } from '../theme/colors';
import { PillIcon } from './PillIcon';

interface DoseCardProps {
  dose: DoseItem;
  onUpdateStatus: (doseId: string, status: DoseStatus) => void;
}

export const DoseCard: React.FC<DoseCardProps> = ({ dose, onUpdateStatus }) => {
  const isTaken = dose.status === 'taken';
  const isSkipped = dose.status === 'skipped';
  const isPending = dose.status === 'pending';

  const handleTake = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onUpdateStatus(dose.id, 'taken');
  };

  const handleSkip = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onUpdateStatus(dose.id, 'skipped');
  };

  const handleUndo = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onUpdateStatus(dose.id, 'pending');
  };

  return (
    <View
      style={[
        styles.card,
        isTaken && styles.cardTaken,
        isSkipped && styles.cardSkipped,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Pill Visual Avatar */}
        <PillIcon form={dose.form} color={dose.color} size={48} />

        {/* Center: Medicine Details */}
        <View style={styles.detailsCol}>
          <View style={styles.timeBadgeRow}>
            <View style={styles.timeBadge}>
              <Clock size={12} color="#0284C7" />
              <Text style={styles.timeText}>{dose.scheduledTime}</Text>
            </View>
            <Text style={styles.categoryText}>{dose.timeCategory}</Text>
          </View>

          <Text style={[styles.medName, isTaken && styles.textMuted]}>
            {dose.medicationName}
          </Text>
          <Text style={styles.dosageText}>{dose.dosage}</Text>

          {dose.instructions ? (
            <Text style={styles.instructionsText} numberOfLines={2}>
              {dose.instructions}
            </Text>
          ) : null}
        </View>

        {/* Right: Status or Actions */}
        <View style={styles.actionsCol}>
          {isPending && (
            <View style={styles.pendingActionGroup}>
              <TouchableOpacity
                style={styles.takeBtn}
                onPress={handleTake}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.takeBtnText}>Take</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}

          {isTaken && (
            <View style={styles.completedBadgeGroup}>
              <View style={styles.takenBadge}>
                <Check size={14} color="#15803D" strokeWidth={3} />
                <Text style={styles.takenBadgeText}>Taken</Text>
              </View>
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={handleUndo}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <RotateCcw size={12} color="#94A3B8" />
                <Text style={styles.undoText}>Undo</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSkipped && (
            <View style={styles.completedBadgeGroup}>
              <View style={styles.skippedBadge}>
                <X size={14} color="#64748B" strokeWidth={2.5} />
                <Text style={styles.skippedBadgeText}>Skipped</Text>
              </View>
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={handleUndo}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <RotateCcw size={12} color="#94A3B8" />
                <Text style={styles.undoText}>Undo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardSkipped: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  textMuted: {
    color: '#166534',
  },
  dosageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  instructionsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pendingActionGroup: {
    alignItems: 'center',
  },
  takeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  skipBtn: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  completedBadgeGroup: {
    alignItems: 'center',
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  takenBadgeText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  skippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  skippedBadgeText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 2,
  },
  undoText: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 3,
  },
});
