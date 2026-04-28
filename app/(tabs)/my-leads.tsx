// ════════════════════════════════════════════════════════
// app/(tabs)/my-leads.tsx
// ════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking } from 'react-native'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import api from '../../src/lib/api'

const STATUS_COLORS: Record<string,string> = {
  sold:'#6699ff', completed:'#00ff88', pending:'#ffaa00'
}

export default function MyLeadsScreen() {
  const [leads,   setLeads]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [status,  setStatus]  = useState('sold')

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/providers/leads', { params:{ status } })
      setLeads(res.data.leads)
    } catch { Toast.show({ type:'error', text1:'Failed to load' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [status])

  const markComplete = async (id: string) => {
    try {
      await api.patch(`/api/providers/leads/${id}/complete`)
      Toast.show({ type:'success', text1:'Lead marked complete!' })
      fetch()
    } catch { Toast.show({ type:'error', text1:'Failed' }) }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>My <Text style={{ color:'#00d4ff' }}>Leads</Text></Text>

      {/* Status tabs */}
      <View style={s.tabs}>
        {['sold','completed'].map(t => (
          <TouchableOpacity key={t} onPress={() => setStatus(t)} style={[s.tab, status===t && s.tabActive]}>
            <Text style={[s.tabText, status===t && s.tabTextActive]}>{t === 'sold' ? 'Active' : 'Completed'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={leads}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await fetch(); setRefresh(false) }} tintColor="#00d4ff"/>}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No {status} leads yet.</Text> : null}
        contentContainerStyle={{ padding:16, gap:12 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
              <View style={[s.badge, { borderColor: STATUS_COLORS[item.status]+'44', backgroundColor: STATUS_COLORS[item.status]+'11' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.roomType}</Text>
              </View>
              <Text style={s.paid}>₹{item.leadPrice || 299} paid</Text>
            </View>

            <Text style={s.clientName}>{item.name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
              <Text style={s.phone}>📞 {item.phone}</Text>
            </TouchableOpacity>
            <Text style={s.meta}>📍 {item.city}  ·  {item.length && `${item.length}×${item.width} ft`}</Text>
            {item.budget && <Text style={s.meta}>Budget: {item.budget}</Text>}
            {item.requirements && <Text style={s.req} numberOfLines={2}>{item.requirements}</Text>}
            {item.videoUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(item.videoUrl)}>
                <Text style={s.videoLink}>📹 Watch requirement video →</Text>
              </TouchableOpacity>
            )}
            <Text style={s.time}>Purchased {formatDistanceToNow(new Date(item.soldAt || item.createdAt), { addSuffix:true })}</Text>
            {item.status === 'sold' && (
              <TouchableOpacity style={s.completeBtn} onPress={() => markComplete(item._id)}>
                <Text style={s.completeBtnText}>✓ Mark as Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:'#020814' },
  title:         { fontSize:22, fontWeight:'800', color:'#e8f4ff', padding:20, paddingTop:60, letterSpacing:-0.5 },
  tabs:          { flexDirection:'row', paddingHorizontal:16, gap:8, marginBottom:4 },
  tab:           { borderWidth:0.5, borderColor:'#0a1628', paddingHorizontal:16, paddingVertical:8 },
  tabActive:     { borderColor:'#00d4ff', backgroundColor:'rgba(0,212,255,0.08)' },
  tabText:       { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, textTransform:'uppercase', letterSpacing:1 },
  tabTextActive: { color:'#00d4ff' },
  card:          { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', padding:16, gap:6 },
  badge:         { borderWidth:0.5, paddingHorizontal:8, paddingVertical:3 },
  badgeText:     { fontFamily:'SpaceMono', fontSize:10 },
  paid:          { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11 },
  clientName:    { color:'#e8f4ff', fontSize:16, fontWeight:'700' },
  phone:         { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:13 },
  meta:          { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11 },
  req:           { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, fontStyle:'italic' },
  videoLink:     { color:'#00ff88', fontFamily:'SpaceMono', fontSize:11 },
  time:          { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10 },
  completeBtn:   { backgroundColor:'rgba(0,255,136,0.1)', borderWidth:0.5, borderColor:'rgba(0,255,136,0.3)', padding:12, alignItems:'center', marginTop:4 },
  completeBtnText: { color:'#00ff88', fontFamily:'SpaceMono', fontSize:11, fontWeight:'700', letterSpacing:1 },
  empty:         { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12, textAlign:'center', padding:40 },
})
