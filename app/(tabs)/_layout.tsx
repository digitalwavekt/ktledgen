import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { useEffect } from 'react'
import { useAuthStore } from '../../src/store/auth'
import { connectSocket } from '../../src/lib/socket'
import { usePushNotifications } from '../../src/hooks/usePushNotifications'

function TabIcon({ icon, label, focused }: { icon:string; label:string; focused:boolean }) {
  return (
    <View style={{ alignItems:'center', paddingTop:6 }}>
      <Text style={{ fontSize:18 }}>{icon}</Text>
      <Text style={{
        fontSize:9, fontFamily:'SpaceMono', marginTop:2, letterSpacing:0.5,
        color: focused ? '#00d4ff' : '#5a7a99'
      }}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const { provider } = useAuthStore()
  usePushNotifications()

  useEffect(() => {
    if (provider?._id) connectSocket(provider._id)
  }, [provider])

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#050f1f',
        borderTopColor: '#0a1628',
        borderTopWidth: 0.5,
        height: 70,
        paddingBottom: 8,
      },
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="leads"         options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="LEADS"    focused={focused}/> }}/>
      <Tabs.Screen name="my-leads"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="MY LEADS" focused={focused}/> }}/>
      <Tabs.Screen name="portfolio"     options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📷" label="PORTFOLIO" focused={focused}/> }}/>
      <Tabs.Screen name="wallet"        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="WALLET"   focused={focused}/> }}/>
      <Tabs.Screen name="profile"       options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="PROFILE"  focused={focused}/> }}/>
    </Tabs>
  )
}
