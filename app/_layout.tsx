import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../src/store/auth'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  const { token, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate().then(() => {
      const t = useAuthStore.getState().token
      if (!t) router.replace('/(auth)/login')
    })
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#020814"/>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#020814' } }}>
        <Stack.Screen name="(auth)"  options={{ headerShown: false }}/>
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }}/>
        <Stack.Screen name="lead/[id]" options={{ headerShown: false, presentation: 'modal' }}/>
      </Stack>
      <Toast/>
    </GestureHandlerRootView>
  )
}
