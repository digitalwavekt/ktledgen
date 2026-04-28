import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AuthState {
  token:    string | null
  provider: any | null
  setAuth:  (token: string, provider: any) => void
  logout:   () => void
  hydrate:  () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token:    null,
  provider: null,

  setAuth: async (token, provider) => {
    await SecureStore.setItemAsync('kt_token',    token)
    await SecureStore.setItemAsync('kt_provider', JSON.stringify(provider))
    set({ token, provider })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('kt_token')
    await SecureStore.deleteItemAsync('kt_provider')
    set({ token: null, provider: null })
  },

  hydrate: async () => {
    try {
      const token    = await SecureStore.getItemAsync('kt_token')
      const provStr  = await SecureStore.getItemAsync('kt_provider')
      const provider = provStr ? JSON.parse(provStr) : null
      if (token && provider) set({ token, provider })
    } catch {}
  },
}))
