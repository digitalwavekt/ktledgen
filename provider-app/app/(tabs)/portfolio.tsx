import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         FlatList, Image, Alert, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import api from '../../src/lib/api'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export default function PortfolioScreen() {
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [showForm,   setShowForm]   = useState(false)
  const [beforeImgs, setBeforeImgs] = useState<string[]>([])
  const [afterImgs,  setAfterImgs]  = useState<string[]>([])
  const [title,      setTitle]      = useState('')

  const fetchPortfolios = async () => {
    try {
      const res = await api.get('/api/portfolio/my')
      setPortfolios(res.data.portfolios)
    } catch {}
  }

  useEffect(() => { fetchPortfolios() }, [])

  const pickImages = async (type: 'before' | 'after') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (result.canceled) return
    const uris = result.assets.map(a => a.uri)
    if (type === 'before') setBeforeImgs(prev => [...prev, ...uris].slice(0,5))
    else                   setAfterImgs(prev  => [...prev, ...uris].slice(0,5))
  }

  const uploadImage = async (uri: string, type: 'before' | 'after', projectId: string) => {
    const fileName = uri.split('/').pop() || 'image.jpg'
    const fileType = 'image/jpeg'

    // Get presigned URL
    const res = await api.post('/api/upload/portfolio/presign', { fileName, fileType, type, projectId })
    const { uploadUrl, cdnUrl: url } = res.data

    // Upload to S3
    const blob = await fetch(uri).then(r => r.blob())
    await fetch(uploadUrl, { method:'PUT', body:blob, headers:{ 'Content-Type':fileType } })
    return url
  }

  const handleSubmit = async () => {
    if (afterImgs.length === 0) {
      Toast.show({ type:'error', text1:'Add at least one "after" photo' }); return
    }
    setUploading(true)
    setProgress(0)
    try {
      const projectId = Date.now().toString()
      const total = beforeImgs.length + afterImgs.length
      let done = 0

      const uploadSet = async (imgs: string[], type: 'before'|'after') => {
        const urls = []
        for (const uri of imgs) {
          const url = await uploadImage(uri, type, projectId)
          urls.push({ url, type:'image' })
          done++
          setProgress(Math.round(done/total*90))
        }
        return urls
      }

      const [beforeUrls, afterUrls] = await Promise.all([
        uploadSet(beforeImgs, 'before'),
        uploadSet(afterImgs,  'after'),
      ])

      await api.post('/api/portfolio', { title, beforeUrls, afterUrls })
      setProgress(100)
      Toast.show({ type:'success', text1:'Portfolio submitted!', text2:'Pending admin approval.' })
      setShowForm(false); setBeforeImgs([]); setAfterImgs([]); setTitle('')
      fetchPortfolios()
    } catch {
      Toast.show({ type:'error', text1:'Upload failed. Try again.' })
    } finally { setUploading(false); setProgress(0) }
  }

  if (showForm) return (
    <ScrollView style={s.container}>
      <View style={s.formHeader}>
        <TouchableOpacity onPress={() => setShowForm(false)}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.formTitle}>Add Portfolio</Text>
      </View>

      <View style={{ padding:16, gap:16 }}>
        <View>
          <Text style={s.label}>PROJECT TITLE (optional)</Text>
          <View style={s.input}>
            <Text style={{ color: title ? '#e8f4ff' : '#2a4a6a', fontFamily:'SpaceMono', fontSize:13 }}
              onPress={() => {}} // handled below
            >{title || 'e.g. Modern Living Room Makeover'}</Text>
          </View>
        </View>

        {/* Before photos */}
        <View>
          <Text style={s.label}>BEFORE PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {beforeImgs.map((uri,i) => (
                <View key={i} style={s.imgThumb}>
                  <Image source={{ uri }} style={{ width:80, height:80 }}/>
                  <TouchableOpacity style={s.removeImg} onPress={() => setBeforeImgs(p=>p.filter((_,j)=>j!==i))}>
                    <Text style={{ color:'#fff', fontSize:10 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addImgBtn} onPress={() => pickImages('before')}>
                <Text style={s.addImgText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* After photos */}
        <View>
          <Text style={s.label}>AFTER PHOTOS *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {afterImgs.map((uri,i) => (
                <View key={i} style={s.imgThumb}>
                  <Image source={{ uri }} style={{ width:80, height:80 }}/>
                  <TouchableOpacity style={s.removeImg} onPress={() => setAfterImgs(p=>p.filter((_,j)=>j!==i))}>
                    <Text style={{ color:'#fff', fontSize:10 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[s.addImgBtn, { borderColor:'rgba(0,212,255,0.3)' }]} onPress={() => pickImages('after')}>
                <Text style={[s.addImgText, { color:'#00d4ff' }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {uploading && (
          <View style={s.progressWrap}>
            <Text style={s.progressLabel}>Uploading... {progress}%</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width:`${progress}%` as any }]}/>
            </View>
          </View>
        )}

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={uploading} activeOpacity={0.8}>
          {uploading ? <ActivityIndicator color="#020814"/>
                     : <Text style={s.submitBtnText}>Submit Portfolio →</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My <Text style={{ color:'#00d4ff' }}>Portfolio</Text></Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
          <Text style={s.addBtnText}>+ Add Work</Text>
        </TouchableOpacity>
      </View>

      {portfolios.length === 0 ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:12 }}>
          <Text style={{ fontSize:48 }}>📷</Text>
          <Text style={{ color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12, textAlign:'center', paddingHorizontal:40 }}>
            No portfolio yet. Upload your completed work to attract more clients.
          </Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ Add First Project</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={portfolios}
          keyExtractor={i => i._id}
          numColumns={2}
          contentContainerStyle={{ padding:8 }}
          renderItem={({ item }) => (
            <View style={s.portfolioCard}>
              {item.afterUrls?.[0]?.url
                ? <Image source={{ uri:item.afterUrls[0].url }} style={s.portfolioImg}/>
                : <View style={[s.portfolioImg, { backgroundColor:'#0a1628', alignItems:'center', justifyContent:'center' }]}>
                    <Text style={{ fontSize:32 }}>🏠</Text>
                  </View>}
              <View style={s.portfolioInfo}>
                <Text style={s.portfolioTitle} numberOfLines={1}>{item.title || item.roomType || 'Project'}</Text>
                <Text style={[s.portfolioStatus, { color: item.isApproved ? '#00ff88' : '#ffaa00' }]}>
                  {item.isApproved ? '✓ Approved' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#020814' },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, paddingTop:60 },
  title:          { fontSize:22, fontWeight:'800', color:'#e8f4ff', letterSpacing:-0.5 },
  addBtn:         { backgroundColor:'rgba(0,212,255,0.1)', borderWidth:0.5, borderColor:'rgba(0,212,255,0.3)', paddingHorizontal:14, paddingVertical:8 },
  addBtnText:     { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:11, fontWeight:'700' },
  formHeader:     { flexDirection:'row', alignItems:'center', gap:16, padding:20, paddingTop:60 },
  backBtn:        { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:13 },
  formTitle:      { fontSize:18, fontWeight:'800', color:'#e8f4ff' },
  label:          { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:10, letterSpacing:2, marginBottom:8 },
  input:          { backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', padding:12 },
  imgThumb:       { position:'relative' },
  removeImg:      { position:'absolute', top:2, right:2, backgroundColor:'rgba(0,0,0,0.7)', width:18, height:18, alignItems:'center', justifyContent:'center' },
  addImgBtn:      { width:80, height:80, borderWidth:0.5, borderColor:'#0a1628', alignItems:'center', justifyContent:'center' },
  addImgText:     { color:'#5a7a99', fontFamily:'SpaceMono', fontSize:12 },
  progressWrap:   { gap:8 },
  progressLabel:  { color:'#00d4ff', fontFamily:'SpaceMono', fontSize:11 },
  progressTrack:  { height:3, backgroundColor:'#0a1628', borderRadius:2, overflow:'hidden' },
  progressFill:   { height:'100%', backgroundColor:'#00d4ff' },
  submitBtn:      { backgroundColor:'#00d4ff', padding:16, alignItems:'center', marginBottom:40 },
  submitBtnText:  { color:'#020814', fontFamily:'SpaceMono', fontSize:12, fontWeight:'700', letterSpacing:1 },
  portfolioCard:  { flex:1, margin:4, backgroundColor:'#050f1f', borderWidth:0.5, borderColor:'#0a1628', overflow:'hidden' },
  portfolioImg:   { width:'100%', height:120 },
  portfolioInfo:  { padding:8 },
  portfolioTitle: { color:'#e8f4ff', fontSize:12, fontWeight:'600', marginBottom:2 },
  portfolioStatus:{ fontFamily:'SpaceMono', fontSize:10 },
})
