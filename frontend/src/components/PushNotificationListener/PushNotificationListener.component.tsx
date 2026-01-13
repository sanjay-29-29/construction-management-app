import { LocalNotifications } from '@capacitor/local-notifications';
import {
  PushNotifications,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import type { PluginListenerHandle } from '@capacitor/core';

export const PushNotificationsInit = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let actionListener: PluginListenerHandle | undefined;
    let receiveListener: PluginListenerHandle | undefined;
    let localActionListener: PluginListenerHandle | undefined;
    let registrationListener: PluginListenerHandle | undefined;

    const setupNotifications = async () => {
      const pushPermission = await PushNotifications.requestPermissions();
      if (pushPermission.receive === 'granted') {
        await PushNotifications.register();
      }

      await LocalNotifications.requestPermissions();

      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push notification received:', notification);

          try {
            LocalNotifications.schedule({
              notifications: [
                {
                  id: Date.now(),
                  title: notification.title ?? 'Notification',
                  body: notification.body ?? '',
                  extra: notification.data,
                  sound: 'default',
                },
              ],
            });
          } catch (error) {
            console.error('Error scheduling local notification:', error);
          }
        }
      ).then((h) => {
        receiveListener = h;
      });

      // 👆 User TAPS push notification (app in BACKGROUND/KILLED)
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification tapped:', notification);
          const data = notification.notification.data;

          if (data?.internalRoute) {
            navigate(`/${data.internalRoute}`, { replace: true });
          }
        }
      ).then((h) => {
        actionListener = h;
      });

      // 👆 User TAPS local notification (app in FOREGROUND)
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notification) => {
          const data = notification.notification.extra;

          if (data?.internalRoute) {
            navigate(`/${data.internalRoute}`, { replace: true });
          }
        }
      ).then((h) => {
        localActionListener = h;
      });
    };

    setupNotifications();

    return () => {
      receiveListener?.remove();
      actionListener?.remove();
      localActionListener?.remove();
      registrationListener?.remove();
    };
  }, []);

  return null;
};
