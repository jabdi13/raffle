'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket, RaffleState } from '@/lib/socket'
import confetti from 'canvas-confetti'

export default function DisplayPage() {
  const [state, setState] = useState<RaffleState | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const seenWinnerIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const socket = getSocket()

    socket.on('sync-state', (newState: RaffleState) => {
      // Check if there's a new winner we haven't seen before
      const currentWinnerId = newState.currentItem?.winner?.id
      const isNewWinner = currentWinnerId && !seenWinnerIdsRef.current.has(currentWinnerId)

      if (isNewWinner) {
        // New winner - trigger reveal animation and confetti
        setIsRevealing(true)

        setTimeout(() => {
          setIsRevealing(false)
          setShowWinner(true)
          setState(newState)
          seenWinnerIdsRef.current.add(currentWinnerId)

          // Trigger celebration only for first time
          triggerConfetti()
        }, 2000) // Reveal duration
      } else {
        setState(newState)
        setShowWinner(!!currentWinnerId)
        if (currentWinnerId) {
          seenWinnerIdsRef.current.add(currentWinnerId)
        }
      }
    })

    return () => {
      socket.off('sync-state')
    }
  }, [])

  const triggerConfetti = () => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex items-center justify-center">
        <div className="text-2xl animate-pulse">Conectando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {state.currentItem ? (
          <div className="text-center max-w-2xl">
            {/* Winner Section */}
            <h1 className="text-8xl font-bold mb-8">{state.currentItem.winner?.name}</h1>

            {/* Item Name */}
            <div className="min-h-[200px] flex items-center justify-center">
              {isRevealing ? (
                <div className="text-center">
                  <div className="text-4xl animate-bounce mb-4">🥁</div>
                  <div className="text-2xl animate-pulse">Seleccionando ganador...</div>
                </div>
              ) : showWinner && state.currentItem.name ? (
                <div className="animate-fade-in">
                  <div className="text-3xl text-yellow-400 mb-2">🎁 Premio 🎁</div>
                  <div className="text-8xl font-bold text-yellow-300 mb-2">
                    {state.currentItem.name}
                  </div>
                </div>
              ) : (
                <div className="text-2xl text-gray-400 animate-pulse">
                  Esperando la rifa...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">No hay elementos aun</h1>
            <p className="text-gray-300">Agrega elementos para comenzar</p>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="w-[35%] bg-black/30 p-6 overflow-y-auto text-center max-h-screen">
        {/* <h2 className="text-6xl font-bold mb-4">Historial de ganadores</h2> */}
        {state.history.length > 0 ? (
          <div className="space-y-3">
            {state.history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-lg ${
                  item.id === state.currentItem?.id
                    ? 'bg-yellow-500/30 ring-2 ring-yellow-400'
                    : 'bg-white/10'
                }`}
              >
                <div className="font-semibold text-5xl">{item.winner?.name}</div>
                <div className="font-semibold text-5xl text-yellow-400">
                  Premio: {item.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No hay ganadores aun</p>
        )}
      </div>

      {/* CSS for fade-in animation */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
