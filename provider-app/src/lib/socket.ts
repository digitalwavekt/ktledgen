// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'
import { BASE_URL } from './api'

let socket: Socket | null = null

export const connectSocket = (providerId: string) => {
  if (socket?.connected) return socket
  socket = io(BASE_URL, { transports: ['websocket'], reconnection: true })
  socket.on('connect', () => {
    socket?.emit('join-provider', providerId)
    console.log('Socket connected')
  })
  return socket
}

export const getSocket = () => socket
export const disconnectSocket = () => { socket?.disconnect(); socket = null }
