import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPresentAlert: true,
  }),
});

export const NotificationService = {
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0284C7',
          sound: 'default',
        });
      }

      return true;
    } catch (e) {
      console.warn('Could not request notification permissions:', e);
      return false;
    }
  },

  // Schedule a dose alert
  async scheduleDoseReminder(
    medicationName: string,
    dosage: string,
    instructions: string,
    hour: number,
    minute: number
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${medicationName} (${dosage})`,
          body: instructions || 'Please take your scheduled medication now.',
          data: { medicationName, dosage },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      return identifier;
    } catch (e) {
      console.warn('Error scheduling notification:', e);
      return null;
    }
  },

  // Instant test notification
  async triggerTestReminder(medicationName: string, dosage: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 Reminder: ${medicationName}`,
          body: `Scheduled dose: ${dosage}. Stay healthy and consistent!`,
          sound: 'default',
        },
        trigger: null, // send immediately
      });
    } catch (e) {
      console.warn('Error triggering test notification:', e);
    }
  },

  // Cancel all scheduled notifications
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('Error cancelling notifications:', e);
    }
  },
};
