import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import Toast from 'react-native-toast-message'
import RazorpayCheckout from 'react-native-razorpay'
import { formatDistanceToNow } from 'date-fns'
import api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/auth'

const RECHARGE_AMTS = [500, 1000, 2000, 5000]

export default function WalletScreen() {
  const [balance,  setBalance]  = useState(0)
  const [txns,     setTxns]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [recharging, setRecharging] = useState(false)
  const { provider, setAuth } = useAuthStore()

  const fetchWallet = async () => {
    setLoading(true)
    try {
      const [meRes, txRes] = await Promise.all([
        api.get('/auth/provider/me'),
        api.get('/api/payments/transactions', { params:{ limit:30 } }),
      ])
      setBalance(meRes.data.provider.walletBalance)
      setTxns(txRes.data.transactions)
      await setAuth(useAuthStore.getState().token!, meRes.data.provider)
    } catch { Toast.show({ type:'error', text1:'Failed to load wallet' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWallet() }, [])

  const handleRecharge = async (amount: number) => {
    setRecharging(true)
    try {
      // Step 1 — Create Razorpay order
      const orderRes = await api.post('/api/payments/wallet/order', { amount })
      const { order, key } = orderRes.data

      // Step 2 — Open Razorpay checkout
      const options = {
        description:  'KT Interior Wallet Recharge',
        image:        'https://your-logo-url.com/logo.png',
        currency:     'INR',
        key,
        amount:       order.amount,
        name:         'KT Interior',
        order_id:     order.id,
        prefill: {
          email: provider?.email || '',
          contact: provider?.phone || '',
          name:  provider?.name  || '',
        },
        theme: { color: '#00d4ff' },
      }

      const payment = await RazorpayCheckout.open(options)

      // Step 3 — Verify payment on backend
      await api.post('/api/payments/wallet/verify', {
        razorpay_order_id:   payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature:  payment.razorpay_signature,
        amount,
      })

      Toast.show({ type:'success', text1:`₹${amount} added to wallet!` })
      fetchWallet()
    } catch (err: any) {
      if (err?.code !== 'PAYMENT_CANCELLED') {
        Toast.show({ type:'error', text1:'Payment failed', text2:err.description || '' })
      }
    } finally { setRecharging(false) }
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWallet} tintColor="#00d4ff"/>}>
      <Text style={s.title}>My <Text style={{ color:'#00d4ff' }}>Wallet</Text></Text>

      {/* Balance card */}
      <View style={s.balanceCard}>
        <View style={s.balanceTop}/>
        <Text style={s.balanceLabel}>Available Balance</Text>
        <Text style={s.balanceAmt}>₹{balance.toLocaleString()}</Text>
        <Text style={s.balanceSub}>Use this to purchase leads from the marketplace</Text>
      </View>

      {/* Quick recharge */}
      <Text style={s.sectionTitle}>// Recharge Wallet</Text>
      <View style={s.rechargeGrid}>
        {RECHARGE_AMTS.map(amt => (
          <TouchableOpacity key={amt} style={s.rechargeBtn} onPress={() => handleRecharge(amt)}
            disabled={recharging} activeOpacity={0.8}>
            {recharging ? <ActivityIndicator color="#00d4ff" size="small"/> : (
              <>
                <Text style={s.rechargePrimary}>₹{amt}</Text>
                <Text style={s.rechargeSub}>{Math.floor(amt/299)} leads</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction history */}
      <Text style={s.sectionTitle}>// Transaction History</Text>
      {txns.length === 0 ? (
        <Text style={s.empty}>No transactions yet.</Text>
      ) : (
        txns.map(txn => (
          <View key={txn._id} style={s.txn}>
            <View style={{ flex:1 }}>
              <Text style={s.txnDesc}>{txn.description}</Text>
              {txn.leadId && <Text style={s.txnMeta}>{txn.leadId.roomType} · {txn.leadId.city}</Text>}
              <Text style={s.txnTime}>{formatDistanceToNow(new Date(txn.createdAt), { addSuffix:true })}</Text>
            </View>
            <Text style={[s.txnAmt, { color: txn.type === 'credit' ? '#00ff88' : '#ff6688' }]}>
              {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
            </Text>
          </View>
        ))
      )}
      <View style={{ height:40 }}/>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#020814' },
  title:          { fontSize:22, fontWeight:'800', color:'#e8f4ff', padding:20, paddingTop:60, letterSpacing:-0.5 },
  balanceCard:    { margin:16, backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'rgba(0,212,255,0.2)', padding:24, alignItems:'center', position:'relative', overflow:'hidden' },
  balanceTop:     { position:'absolute', top:0, left:0, right:0, height:1, backgroundColor:'#00d4ff', opacity:0.5 },
  balanceLabel:   { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11, letterSpacing:2, marginBottom:8 },
  balanceAmt:     { fontSize:44, fontWeight:'800', color:'#00d4ff', letterSpacing:-1 },
  balanceSub:     { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10, marginTop:8, textAlign:'center' },
  sectionTitle:   { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10, letterSpacing:2, paddingHorizontal:16, marginBottom:12, marginTop:8 },
  rechargeGrid:   { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:12, gap:8, marginBottom:24 },
  rechargeBtn:    { flex:1, minWidth:'45%', backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', padding:16, alignItems:'center' },
  rechargePrimary:{ color:'#e8f4ff', fontSize:20, fontWeight:'700', fontFamily:'SpaceMono' },
  rechargeSub:    { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:10, marginTop:4 },
  txn:            { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:'#0a1628' },
  txnDesc:        { color:'#e8f4ff', fontSize:13, fontWeight:'600', marginBottom:2 },
  txnMeta:        { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:10 },
  txnTime:        { color:'#2a4a6a', fontFamily:'SpaceMono', fontSize:10, marginTop:2 },
  txnAmt:         { fontFamily:'SpaceMono', fontSize:15, fontWeight:'700' },
  empty:          { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12, textAlign:'center', padding:40 },
})
