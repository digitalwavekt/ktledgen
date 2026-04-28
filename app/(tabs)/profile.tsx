import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         Switch, Alert, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'
import { router } from 'expo-router'
import api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/auth'

export default function ProfileScreen() {
  const { provider, logout, setAuth, token } = useAuthStore()
  const [stats,    setStats]    = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [notifs,   setNotifs]   = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/provider/me')
      await setAuth(token!, res.data.provider)
      // Fetch notification count
      const nRes = await api.get('/api/notifications', { params:{ limit:1 } })
      setStats({ unread: nRes.data.unread })
    } catch {}
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text:'Cancel', style:'cancel' },
      { text:'Logout', style:'destructive', onPress: async () => {
        await logout()
        router.replace('/(auth)/login')
      }},
    ])
  }

  const statItems = [
    { label:'Wallet Balance', val:`₹${provider?.walletBalance || 0}`,   color:'#00d4ff' },
    { label:'Leads Bought',   val: provider?.totalLeadsBought || 0,      color:'#6699ff' },
    { label:'Completed',      val: provider?.totalLeadsCompleted || 0,   color:'#00ff88' },
    { label:'Rating',         val: provider?.rating ? `${provider.rating.toFixed(1)}★` : 'N/A', color:'#ffaa00' },
  ]

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {provider?.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || 'KT'}
          </Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={s.name}>{provider?.name || 'Provider'}</Text>
          {provider?.businessName && <Text style={s.business}>{provider.businessName}</Text>}
          <Text style={s.city}>📍 {provider?.city || 'City'}</Text>
          <View style={[s.verifiedBadge, { borderColor: provider?.isVerified ? '#00ff88' : '#ffaa00' }]}>
            <Text style={[s.verifiedText, { color: provider?.isVerified ? '#00ff88' : '#ffaa00' }]}>
              {provider?.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        {statItems.map(item => (
          <View key={item.label} style={s.statCard}>
            <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Info */}
      <Text style={s.sectionTitle}>// Account Info</Text>
      {[
        ['Email',      provider?.email   || '-'],
        ['Phone',      provider?.phone   || '-'],
        ['City',       provider?.city    || '-'],
        ['Speciality', provider?.speciality?.join(', ') || '-'],
        ['Service Areas', provider?.serviceAreas?.join(', ') || provider?.city || '-'],
      ].map(([k,v]) => (
        <View key={k} style={s.infoRow}>
          <Text style={s.infoLabel}>{k}</Text>
          <Text style={s.infoVal}>{v}</Text>
        </View>
      ))}

      {/* Settings */}
      <Text style={s.sectionTitle}>// Settings</Text>
      <View style={s.settingRow}>
        <Text style={s.settingLabel}>Push Notifications</Text>
        <Switch value={notifs} onValueChange={setNotifs}
          trackColor={{ false:'#0a1628', true:'rgba(0,212,255,0.4)' }}
          thumbColor={notifs ? '#00d4ff' : '#5a7a99'}/>
      </View>

      {/* Help */}
      <Text style={s.sectionTitle}>// Support</Text>
      {[
        ['📞 Call Support',    () => {}],
        ['📧 Email Support',   () => {}],
        ['📄 Terms of Service',() => {}],
        ['🔒 Privacy Policy',  () => {}],
      ].map(([label, fn]) => (
        <TouchableOpacity key={label as string} style={s.menuItem} onPress={fn as () => void} activeOpacity={0.7}>
          <Text style={s.menuText}>{label as string}</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={s.version}>KT Interior Provider v1.0.0</Text>
      <View style={{ height:40 }}/>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#020814' },
  header:       { flexDirection:'row', gap:16, padding:20, paddingTop:60, alignItems:'flex-start' },
  avatar:       { width:64, height:64, borderRadius:32, backgroundColor:'#0066ff',
                 alignItems:'center', justifyContent:'center', flexShrink:0 },
  avatarText:   { color:'#fff', fontSize:22, fontWeight:'800' },
  name:         { fontSize:20, fontWeight:'800', color:'#e8f4ff', marginBottom:2 },
  business:     { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, marginBottom:2 },
  city:         { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, marginBottom:8 },
  verifiedBadge:{ borderWidth:0.5, paddingHorizontal:8, paddingVertical:3, alignSelf:'flex-start' },
  verifiedText: { fontFamily:'SpaceMono', fontSize:10 },
  statsGrid:    { flexDirection:'row', flexWrap:'wrap', padding:12, gap:8 },
  statCard:     { flex:1, minWidth:'45%', backgroundColor:'#050f1f', borderWidth:0.5,
                 borderColor:'#0a1628', padding:14, alignItems:'center' },
  statVal:      { fontSize:22, fontWeight:'800', fontFamily:'SpaceMono', marginBottom:4 },
  statLabel:    { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:9, letterSpacing:1, textTransform:'uppercase' },
  sectionTitle: { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10, letterSpacing:2,
                 paddingHorizontal:16, marginBottom:8, marginTop:16 },
  infoRow:      { flexDirection:'row', paddingHorizontal:16, paddingVertical:12,
                 borderBottomWidth:0.5, borderBottomColor:'#0a1628', gap:12 },
  infoLabel:    { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, width:100, flexShrink:0 },
  infoVal:      { color:'#e8f4ff', fontFamily:'SpaceMono', fontSize:11, flex:1 },
  settingRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                 paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:'#0a1628' },
  settingLabel: { color:'#e8f4ff', fontSize:14 },
  menuItem:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                 paddingHorizontal:16, paddingVertical:16, borderBottomWidth:0.5, borderBottomColor:'#0a1628' },
  menuText:     { color:'#e8f4ff', fontSize:14 },
  menuArrow:    { color:'#5a7a99', fontSize:18 },
  logoutBtn:    { margin:16, marginTop:24, borderWidth:0.5, borderColor:'rgba(255,68,102,0.3)',
                 padding:16, alignItems:'center' },
  logoutText:   { color:'#ff4466', fontFamily:'SpaceMono', fontSize:12, letterSpacing:2 },
  version:      { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10, textAlign:'center', marginTop:8 },
})
