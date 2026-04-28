import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, ActivityIndicator, Modal, ScrollView
} from 'react-native'
import Toast from 'react-native-toast-message'
import { formatDistanceToNow } from 'date-fns'
import api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/auth'

const ROOM_TYPES = ['All','Living Room','Bedroom','Kitchen','Full Home','Office','Outdoor']

export default function LeadsScreen() {
  const [leads,    setLeads]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [refresh,  setRefresh]  = useState(false)
  const [city,     setCity]     = useState('')
  const [roomType, setRoomType] = useState('All')
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [buying,   setBuying]   = useState(false)
  const { provider } = useAuthStore()

  const fetchLeads = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const p = reset ? 1 : page
      const res = await api.get('/api/leads/marketplace', {
        params: { page: p, limit: 20, city: city || undefined, roomType: roomType !== 'All' ? roomType : undefined }
      })
      const newLeads = res.data.leads
      setLeads(prev => reset ? newLeads : [...prev, ...newLeads])
      setHasMore(newLeads.length === 20)
      if (!reset) setPage(p + 1)
    } catch { Toast.show({ type:'error', text1:'Failed to load leads' }) }
    finally { setLoading(false) }
  }, [city, roomType, page])

  useEffect(() => { setPage(1); fetchLeads(true) }, [city, roomType])

  const onRefresh = async () => {
    setRefresh(true); setPage(1)
    await fetchLeads(true)
    setRefresh(false)
  }

  const handleBuyLead = async () => {
    if (!selected) return
    if ((provider?.walletBalance || 0) < (selected.leadPrice || 299)) {
      Toast.show({ type:'error', text1:'Insufficient wallet balance', text2:'Recharge your wallet first' })
      return
    }
    setBuying(true)
    try {
      const res = await api.post('/api/payments/lead/buy', { leadId: selected._id })
      Toast.show({ type:'success', text1:'Lead purchased!', text2:`Contact: ${res.data.lead.phone}` })
      setSelected(null)
      setPage(1); fetchLeads(true)
    } catch (err: any) {
      Toast.show({ type:'error', text1: err.response?.data?.error || 'Purchase failed' })
    } finally { setBuying(false) }
  }

  const renderLead = ({ item }: { item: any }) => (
    <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
      <View style={s.cardTop}>
        <View style={s.cardBadge}><Text style={s.badgeText}>{item.roomType}</Text></View>
        {item.videoUrl && <View style={s.videoBadge}><Text style={s.videoBadgeText}>📹 Video</Text></View>}
        <Text style={s.price}>₹{item.leadPrice || 299}</Text>
      </View>
      <Text style={s.cardCity}>📍 {item.city}{item.budget ? `  ·  ${item.budget}` : ''}</Text>
      {item.length && item.width && (
        <Text style={s.cardDim}>{item.length}×{item.width} ft{item.height ? ` × ${item.height}ft` : ''}</Text>
      )}
      {item.styles?.length > 0 && (
        <Text style={s.cardStyles}>{item.styles.slice(0,3).join('  ·  ')}</Text>
      )}
      <Text style={s.cardTime}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix:true })}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Lead <Text style={{ color:'#00d4ff' }}>Marketplace</Text></Text>
        <View style={s.walletChip}>
          <Text style={s.walletText}>₹{provider?.walletBalance || 0}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <TextInput style={[s.searchInput, { flex:1 }]} value={city} onChangeText={setCity}
          placeholder="Filter by city..." placeholderTextColor="#2a4a6a"/>
      </View>

      {/* Room type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        {ROOM_TYPES.map(rt => (
          <TouchableOpacity key={rt} onPress={() => setRoomType(rt)}
            style={[s.filterChip, roomType === rt && s.filterChipActive]}>
            <Text style={[s.filterText, roomType === rt && s.filterTextActive]}>{rt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={leads}
        keyExtractor={i => i._id}
        renderItem={renderLead}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor="#00d4ff"/>}
        onEndReached={() => hasMore && fetchLeads()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No leads available in your area right now.</Text> : null}
        ListFooterComponent={loading && leads.length > 0 ? <ActivityIndicator color="#00d4ff" style={{ margin:16 }}/> : null}
        contentContainerStyle={{ padding:16, gap:12 }}
      />

      {/* Lead detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        <View style={s.modal}>
          <View style={s.modalHandle}/>
          <ScrollView>
            <Text style={s.modalTitle}>Lead Details</Text>

            {selected && (
              <View style={{ gap:12 }}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Space</Text>
                  <Text style={s.infoVal}>{selected.roomType}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>City</Text>
                  <Text style={s.infoVal}>{selected.city}</Text>
                </View>
                {selected.budget && <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Budget</Text>
                  <Text style={s.infoVal}>{selected.budget}</Text>
                </View>}
                {selected.length && <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Size</Text>
                  <Text style={s.infoVal}>{selected.length}×{selected.width} ft</Text>
                </View>}
                {selected.styles?.length > 0 && <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Style</Text>
                  <Text style={s.infoVal}>{selected.styles.join(', ')}</Text>
                </View>}
                {selected.requirements && <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Requirements</Text>
                  <Text style={[s.infoVal, { flex:1 }]}>{selected.requirements}</Text>
                </View>}
                {selected.videoUrl && <View style={s.videoPill}>
                  <Text style={s.videoPillText}>📹 Video requirement available after purchase</Text>
                </View>}

                {/* Price box */}
                <View style={s.priceBox}>
                  <Text style={s.priceLabel}>Lead Price</Text>
                  <Text style={s.priceVal}>₹{selected.leadPrice || 299}</Text>
                </View>
                <View style={s.balanceRow}>
                  <Text style={s.balanceLabel}>Your wallet balance</Text>
                  <Text style={[s.balanceVal, { color: (provider?.walletBalance||0) >= (selected.leadPrice||299) ? '#00ff88' : '#ff4466' }]}>
                    ₹{provider?.walletBalance || 0}
                  </Text>
                </View>

                <TouchableOpacity style={s.buyBtn} onPress={handleBuyLead} disabled={buying} activeOpacity={0.8}>
                  {buying
                    ? <ActivityIndicator color="#020814"/>
                    : <Text style={s.buyBtnText}>Buy This Lead — ₹{selected.leadPrice || 299}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelected(null)} style={{ alignItems:'center', padding:12 }}>
                  <Text style={{ color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#020814' },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingTop:60 },
  headerTitle: { fontSize:22, fontWeight:'800', color:'#e8f4ff', letterSpacing:-0.5 },
  walletChip:  { backgroundColor:'rgba(0,212,255,0.1)', borderWidth:0.5, borderColor:'rgba(0,212,255,0.3)', paddingHorizontal:12, paddingVertical:6 },
  walletText:  { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:13, fontWeight:'700' },
  searchRow:   { flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:8 },
  searchInput: { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', color:'#e8f4ff', fontFamily:'SpaceMono', fontSize:12, paddingHorizontal:12, paddingVertical:10 },
  filterScroll:{ paddingLeft:16, marginBottom:8 },
  filterChip:  { borderWidth:0.5, borderColor:'#0a1628', paddingHorizontal:14, paddingVertical:7, marginRight:8 },
  filterChipActive: { borderColor:'#00d4ff', backgroundColor:'rgba(0,212,255,0.08)' },
  filterText:  { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:10, letterSpacing:0.5 },
  filterTextActive: { color:'#00d4ff' },
  card:        { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', padding:16 },
  cardTop:     { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  cardBadge:   { backgroundColor:'rgba(0,102,255,0.15)', borderWidth:0.5, borderColor:'rgba(0,102,255,0.3)', paddingHorizontal:8, paddingVertical:3 },
  badgeText:   { color:'#6699ff', fontFamily:'SpaceMono', fontSize:10 },
  videoBadge:  { backgroundColor:'rgba(0,255,136,0.1)', borderWidth:0.5, borderColor:'rgba(0,255,136,0.2)', paddingHorizontal:8, paddingVertical:3 },
  videoBadgeText: { color:'#00ff88', fontFamily:'SpaceMono', fontSize:10 },
  price:       { marginLeft:'auto', color:'#00d4ff', fontFamily:'SpaceMono', fontSize:14, fontWeight:'700' },
  cardCity:    { color:'#e8f4ff', fontSize:14, fontWeight:'600', marginBottom:4 },
  cardDim:     { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, marginBottom:2 },
  cardStyles:  { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:10, marginBottom:4 },
  cardTime:    { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10 },
  empty:       { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12, textAlign:'center', padding:40 },
  modal:       { flex:1, backgroundColor:'#050f1f', padding:24, paddingTop:12 },
  modalHandle: { width:40, height:4, backgroundColor:'#0a1628', borderRadius:2, alignSelf:'center', marginBottom:20 },
  modalTitle:  { fontSize:20, fontWeight:'800', color:'#e8f4ff', marginBottom:20, letterSpacing:-0.5 },
  infoRow:     { flexDirection:'row', gap:12, alignItems:'flex-start' },
  infoLabel:   { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, width:90, flexShrink:0 },
  infoVal:     { color:'#e8f4ff', fontFamily:'SpaceMono', fontSize:12 },
  videoPill:   { backgroundColor:'rgba(0,255,136,0.05)', borderWidth:0.5, borderColor:'rgba(0,255,136,0.2)', padding:12 },
  videoPillText: { color:'#00ff88', fontFamily:'SpaceMono', fontSize:11 },
  priceBox:    { backgroundColor:'rgba(0,212,255,0.05)', borderWidth:0.5, borderColor:'rgba(0,212,255,0.2)', padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8 },
  priceLabel:  { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12 },
  priceVal:    { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:22, fontWeight:'700' },
  balanceRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  balanceLabel:{ color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11 },
  balanceVal:  { fontFamily:'SpaceMono', fontSize:13, fontWeight:'700' },
  buyBtn:      { backgroundColor:'#00d4ff', padding:18, alignItems:'center' },
  buyBtnText:  { color:'#020814', fontFamily:'SpaceMono', fontSize:12, fontWeight:'700', letterSpacing:1 },
})
