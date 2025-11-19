'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket, RaffleState } from '@/lib/socket'
import confetti from 'canvas-confetti'

export default function DisplayPage() {
  const [state, setState] = useState<RaffleState | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const previousWinnerRef = useRef<number | null>(null)

  useEffect(() => {
    const socket = getSocket()

    socket.on('sync-state', (newState: RaffleState) => {
      // Check if there's a new winner
      const currentWinnerId = newState.currentItem?.winner?.id
      const hadPreviousWinner = previousWinnerRef.current === currentWinnerId

      if (currentWinnerId && !hadPreviousWinner) {
        // New winner - trigger reveal animation
        setIsRevealing(true)

        setTimeout(() => {
          setIsRevealing(false)
          setShowWinner(true)
          setState(newState)
          previousWinnerRef.current = currentWinnerId

          // Trigger celebration
          triggerConfetti()
        }, 2000) // Reveal duration
      } else {
        setState(newState)
        setShowWinner(!!currentWinnerId)
        previousWinnerRef.current = currentWinnerId || null
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
        <div className="text-2xl animate-pulse">Connecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {state.status === 'completed' ? (
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4">🎉 Raffle Complete! 🎉</h1>
            <p className="text-2xl text-gray-300">Thank you for participating!</p>
          </div>
        ) : state.currentItem ? (
          <div className="text-center max-w-2xl">
            {/* Item Image */}
            {state.currentItem.imageUrl && (
              <div className="mb-8">
                <img
                  src={state.currentItem.imageUrl}
                  alt={state.currentItem.name}
                  className="w-80 h-80 object-cover rounded-2xl shadow-2xl mx-auto"
                />
              </div>
            )}

            {/* Item Name */}
            <h1 className="text-5xl font-bold mb-8">{state.currentItem.name}</h1>

            {/* Winner Section */}
            <div className="min-h-[200px] flex items-center justify-center">
              {isRevealing ? (
                <div className="text-center">
                  <div className="text-4xl animate-bounce mb-4">🥁</div>
                  <div className="text-2xl animate-pulse">Selecting winner...</div>
                </div>
              ) : showWinner && state.currentItem.winner ? (
                <div className="animate-fade-in">
                  <div className="text-2xl text-yellow-400 mb-2">🏆 WINNER 🏆</div>
                  <div className="text-6xl font-bold text-yellow-300 mb-2">
                    {state.currentItem.winner.name}
                  </div>
                  {state.currentItem.winner.identifier && (
                    <div className="text-xl text-gray-300">
                      ({state.currentItem.winner.identifier})
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl text-gray-400 animate-pulse">
                  Waiting for raffle...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">No Items Available</h1>
            <p className="text-gray-300">Please add items to start the raffle</p>
          </div>
        )}

        {/* Progress indicator */}
        {state.progress.total > 0 && (
          <div className="mt-8 text-center">
            <div className="text-lg text-gray-300">
              Item {state.progress.current + 1} of {state.progress.total}
            </div>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="w-80 bg-black/30 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Winner History</h2>
        {state.history.length > 0 ? (
          <div className="space-y-3">
            {state.history.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white/10 rounded-lg"
              >
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-yellow-400">
                  {item.winner?.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No winners yet</p>
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
