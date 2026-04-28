import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { router, Link } from 'expo-router'
import Toast from 'react-native-toast-message'
import api from '../../src/lib/api'
import { useAuthStore } from '../../src/store/auth'
import { C, F } from '../../src/components/theme'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { setAuth } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) { Toast.show({ type:'error', text1:'Fill all fields' }); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/provider/login', { email, password })
      await setAuth(res.data.token, res.data.provider)
      router.replace('/(tabs)/leads')
    } catch (err: any) {
      Toast.show({ type:'error', text1: err.response?.data?.error || 'Login failed' })
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>KT<Text style={{ color:'#fff' }}>.</Text>provider</Text>
          <Text style={s.sub}>Sign in to access leads</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>EMAIL</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor="#2a4a6a"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>

          <Text style={s.label}>PASSWORD</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#2a4a6a" secureTextEntry/>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color="#020814"/>
              : <Text style={s.btnText}>Sign In →</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection:'row', justifyContent:'center', marginTop:20, gap:6 }}>
            <Text style={s.sub}>New provider? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity><Text style={{ color:'#00d4ff', fontFamily:'SpaceMono', fontSize:12 }}>Register here</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flexGrow:1, backgroundColor:'#020814', justifyContent:'center', padding:24 },
  header:    { alignItems:'center', marginBottom:40 },
  logo:      { fontSize:28, fontWeight:'800', color:'#00d4ff', letterSpacing:-1 },
  sub:       { color:'#5a7a99', fontSize:12, fontFamily:'SpaceMono', marginTop:6 },
  form:      { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', padding:24 },
  label:     { color:'#5a7a99', fontSize:10, fontFamily:'SpaceMono', letterSpacing:2, marginBottom:8, marginTop:16 },
  input:     { backgroundColor:'#0a1628', borderWidth:0.5, borderColor:'#0a1628', color:'#e8f4ff',
               fontFamily:'SpaceMono', fontSize:13, padding:12 },
  btn:       { backgroundColor:'#00d4ff', padding:16, alignItems:'center', marginTop:24 },
  btnText:   { color:'#020814', fontFamily:'SpaceMono', fontSize:12, fontWeight:'700', letterSpacing:2 },
})
