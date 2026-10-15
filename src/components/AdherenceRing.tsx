import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, CheckCircle2, Award } from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface AdherenceSummaryProps {
  totalDoses: number;
  takenDoses: number;
  streakDays?: number;
}

export const AdherenceSummary: React.FC<AdherenceSummaryProps> = ({
  totalDoses,
  takenDoses,
  streakDays = 14,
}) => {
  const percentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;
  const isComplete = totalDoses > 0 && takenDoses === totalDoses;

  const getStatusText = () => {
    if (totalDoses === 0) return 'No medications scheduled today';
    if (isComplete) return 'Outstanding! All doses taken today 🎉';
    if (percentage >= 50) return 'Great progress, keep it up!';
    return 'Take your scheduled medicines on time';
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.infoCol}>
          <Text style={styles.badgeText}>TODAY'S ADHERENCE</Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
          <Text style={styles.statusDescription}>{getStatusText()}</Text>
        </View>

        <View style={styles.streakBadge}>
          <Flame size={20} color="#EA580C" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: isComplete ? Colors.success : Colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.countItem}>
          <CheckCircle2 size={16} color={Colors.success} />
          <Text style={styles.countText}>
            <Text style={styles.countBold}>{takenDoses}</Text> of {totalDoses} doses taken
          </Text>
        </View>

        {isComplete && (
          <View style={styles.badgeSuccess}>
            <Award size={14} color="#15803D" />
            <Text style={styles.badgeSuccessText}>100% Adherence</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakInfo: {
    marginLeft: 6,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C2410C',
    lineHeight: 18,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9A3412',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 6,
  },
  countBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 4,
  },
});
