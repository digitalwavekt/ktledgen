// src/lib/api.ts
import axios from 'axios'
import Constants from 'expo-constants'
import { useAuthStore } from '../store/auth'

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api
export { BASE_URL }
