import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import api from '../lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
})

export function usePushNotifications() {
  const notifListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    registerForPushNotifications()

    notifListener.current = Notifications.addNotificationReceivedListener(n => {
      console.log('Notification received:', n)
    })
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('Notification response:', r)
      // Navigate based on notification type
    })

    return () => {
      Notifications.removeNotificationSubscription(notifListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (status !== 'granted') {
    const { status: asked } = await Notifications.requestPermissionsAsync()
    status = asked
  }
  if (status !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0,250,250,250], lightColor: '#00d4ff',
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  // Register FCM token with backend
  try { await api.patch('/auth/provider/fcm', { fcmToken: token }) } catch {}
}
