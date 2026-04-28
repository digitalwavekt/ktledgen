import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/auth'

const SPECIALITIES = ['Living Room','Bedroom','Kitchen','Bathroom','Full Home','Office','Outdoor']

export default function RegisterScreen() {
  const [form, setForm] = useState({
    name:'', email:'', password:'', phone:'', city:'', businessName:''
  })
  const [speciality, setSpeciality] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const toggle = (s: string) =>
    setSpeciality(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.city) {
      Toast.show({ type:'error', text1:'Fill all required fields' }); return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/provider/register', { ...form, speciality })
      await setAuth(res.data.token, res.data.provider)
      Toast.show({ type:'success', text1:'Registered! Pending verification.' })
      router.replace('/(tabs)/leads')
    } catch (err: any) {
      Toast.show({ type:'error', text1: err.response?.data?.error || 'Registration failed' })
    } finally { setLoading(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Join as <Text style={{ color:'#00d4ff' }}>Provider</Text></Text>
        <Text style={s.sub}>Create your account to start receiving leads</Text>

        {([['name','Full Name *','Rahul Sharma'],['email','Email *','you@example.com'],
           ['phone','Phone *','9876543210'],['city','City *','Mumbai'],
           ['businessName','Business Name','Design Studio Pvt Ltd']] as [keyof typeof form, string, string][]).map(([k,label,ph]) => (
          <View key={k} style={{ marginBottom:12 }}>
            <Text style={s.label}>{label}</Text>
            <TextInput style={s.input} value={form[k]} onChangeText={v => F(k,v)}
              placeholder={ph} placeholderTextColor="#2a4a6a"
              keyboardType={k==='email'?'email-address':k==='phone'?'phone-pad':'default'}
              autoCapitalize={k==='email'?'none':'words'} autoCorrect={false}/>
          </View>
        ))}

        <View style={{ marginBottom:12 }}>
          <Text style={s.label}>PASSWORD *</Text>
          <TextInput style={s.input} value={form.password} onChangeText={v => F('password',v)}
            placeholder="Min 6 characters" placeholderTextColor="#2a4a6a" secureTextEntry/>
        </View>

        <Text style={s.label}>SPECIALITIES (select your expertise)</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:24 }}>
          {SPECIALITIES.map(sp => (
            <TouchableOpacity key={sp} onPress={() => toggle(sp)}
              style={[s.chip, speciality.includes(sp) && s.chipActive]}>
              <Text style={[s.chipText, speciality.includes(sp) && s.chipTextActive]}>{sp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#020814"/> : <Text style={s.btnText}>Create Account →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flexGrow:1, backgroundColor:'#020814', padding:24 },
  title:        { fontSize:26, fontWeight:'800', color:'#e8f4ff', letterSpacing:-0.5, marginBottom:6, marginTop:40 },
  sub:          { color:'#5a7a99', fontSize:12, fontFamily:'SpaceMono', marginBottom:28 },
  label:        { color:'#5a7a99', fontSize:10, fontFamily:'SpaceMono', letterSpacing:2, marginBottom:8 },
  input:        { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', color:'#e8f4ff',
                 fontFamily:'SpaceMono', fontSize:13, padding:12 },
  chip:         { borderWidth:0.5, borderColor:'#0a1628', paddingHorizontal:12, paddingVertical:6 },
  chipActive:   { borderColor:'#00d4ff', backgroundColor:'rgba(0,212,255,0.08)' },
  chipText:     { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:11 },
  chipTextActive:{ color:'#00d4ff' },
  btn:          { backgroundColor:'#00d4ff', padding:16, alignItems:'center', marginTop:8, marginBottom:40 },
  btnText:      { color:'#020814', fontFamily:'SpaceMono', fontSize:12, fontWeight:'700', letterSpacing:2 },
})
