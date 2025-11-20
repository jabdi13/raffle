import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Type definitions for socket events
export interface RaffleItem {
  id: number
  name: string
  imageUrl: string | null
  order: number
  winnerId: number | null
  raffledAt: string | null
  winner: Participant | null
}

export interface Participant {
  id: number
  name: string
  identifier: string | null
  hasWon: boolean
}

export interface RaffleState {
  currentItem: RaffleItem | null
  history: RaffleItem[]
  status: 'waiting' | 'raffling' | 'completed'
  progress: {
    current: number
    total: number
  }
}
