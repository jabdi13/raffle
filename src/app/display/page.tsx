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
      // Christmas colors: red, green, gold, white
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#dc2626', '#16a34a', '#fbbf24', '#ffffff', '#b91c1c']
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#dc2626', '#16a34a', '#fbbf24', '#ffffff', '#b91c1c']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-no-repeat text-white flex items-center justify-center relative overflow-hidden" style={{ backgroundImage: "url('/images/fondo_navidad.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="text-5xl animate-pulse">
          <span className="mr-2">🎄</span>
          Conectando...
          <span className="ml-2">🎄</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-no-repeat text-white flex relative overflow-hidden" style={{ backgroundImage: "url('/images/fondo_navidad.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Snowflakes */}
      <div className="snowflakes" aria-hidden="true">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="snowflake">❄</div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-8 relative z-10">
        {/* Logos - Top Center of Main Content */}
        <div className="flex items-center gap-8" style={{ filter: 'drop-shadow(0rem 0rem 3rem #F2EAC7)' }}>
          <img
            src="/images/Recurso 4A@4x.png"
            alt="ISSSSPEA Logo"
            className="h-28 bg-white p-4 rounded-lg mb-8 mt-4"
          />
          <img
            src="/images/CasaDelPensionado-Logotipo.png"
            alt="Casa Del Pensionado Logo"
            className="h-28 bg-white p-0 rounded-lg mb-8 mt-4"
          />
        </div>

        <div className="flex-1 flex items-center justify-center">
        {state.currentItem ? (
          <div className="text-center max-w-2xl">
            {/* Winner Section */}
            <h1 className="text-9xl font-bold mb-8 text-outline">{state.currentItem.winner?.name}</h1>

            {/* Item Name */}
            <div className="min-h-[200px] flex items-center justify-center">
              {isRevealing ? (
                <div className="text-center">
                  <div className="text-6xl animate-bounce mb-4">🎅</div>
                  <div className="text-2xl animate-pulse">Seleccionando ganador...</div>
                </div>
              ) : showWinner && state.currentItem.name ? (
                <div className="animate-fade-in">
                  <div className="text-7xl text-green-400 mb-2">🎁 Premio 🎁</div>
                  <div className="text-9xl font-bold text-amber-300 mb-2 text-outline">
                    {state.currentItem.name}
                  </div>
                </div>
              ) : (
                <div className="text-2xl text-gray-300 animate-pulse">
                  <span className="mr-2">⭐</span>
                  Esperando la rifa...
                  <span className="ml-2">⭐</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">🎄</div>
            <h1 className="text-4xl font-bold mb-4">No hay elementos aun</h1>
            <p className="text-gray-300">Agrega elementos para comenzar</p>
          </div>
        )}
        </div>
      </div>

      {/* History Sidebar */}
      <div className="w-[35%] bg-black p-6 overflow-y-auto text-center max-h-screen relative z-10 border-l-4 border-green-600">
        {state.history.length > 0 ? (
          <div className="space-y-3">
            {state.history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-lg ${
                  item.id === state.currentItem?.id
                    ? 'bg-red-600/40 ring-2 ring-amber-400'
                    : 'bg-green-900/40'
                }`}
              >
                <div className="font-semibold text-7xl">{item.winner?.name}</div>
                <div className="font-semibold text-7xl text-amber-300">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">
            <div className="text-4xl mb-2">🎁</div>
            <p>No hay ganadores aun</p>
          </div>
        )}
      </div>

      {/* CSS for animations */}
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
        .text-outline {
          -webkit-text-stroke: 3px #000;
          text-shadow:
            3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            -3px 3px 0 #000,
            3px 0 0 #000,
            -3px 0 0 #000,
            0 3px 0 #000,
            0 -3px 0 #000;
        }
        .snowflakes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .snowflake {
          position: absolute;
          top: -40px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 3rem;
          animation: fall linear infinite;
        }
        .snowflake:nth-child(1) { left: 5%; animation-duration: 8s; animation-delay: 0s; font-size: 2.5rem; }
        .snowflake:nth-child(2) { left: 15%; animation-duration: 12s; animation-delay: 1s; font-size: 3.5rem; }
        .snowflake:nth-child(3) { left: 25%; animation-duration: 10s; animation-delay: 2s; font-size: 3rem; }
        .snowflake:nth-child(4) { left: 35%; animation-duration: 14s; animation-delay: 0.5s; font-size: 4rem; }
        .snowflake:nth-child(5) { left: 45%; animation-duration: 9s; animation-delay: 3s; font-size: 2.5rem; }
        .snowflake:nth-child(6) { left: 55%; animation-duration: 11s; animation-delay: 1.5s; font-size: 3.2rem; }
        .snowflake:nth-child(7) { left: 65%; animation-duration: 13s; animation-delay: 2.5s; font-size: 3.8rem; }
        .snowflake:nth-child(8) { left: 75%; animation-duration: 10s; animation-delay: 0s; font-size: 3rem; }
        .snowflake:nth-child(9) { left: 85%; animation-duration: 8s; animation-delay: 4s; font-size: 2.5rem; }
        .snowflake:nth-child(10) { left: 95%; animation-duration: 12s; animation-delay: 2s; font-size: 3.5rem; }
        .snowflake:nth-child(11) { left: 10%; animation-duration: 15s; animation-delay: 1s; font-size: 3rem; }
        .snowflake:nth-child(12) { left: 30%; animation-duration: 9s; animation-delay: 3.5s; font-size: 2.8rem; }
        .snowflake:nth-child(13) { left: 50%; animation-duration: 11s; animation-delay: 0.5s; font-size: 3.6rem; }
        .snowflake:nth-child(14) { left: 70%; animation-duration: 14s; animation-delay: 2s; font-size: 3.2rem; }
        .snowflake:nth-child(15) { left: 90%; animation-duration: 10s; animation-delay: 1s; font-size: 3rem; }
        .snowflake:nth-child(16) { left: 8%; animation-duration: 13s; animation-delay: 0.3s; font-size: 2.8rem; }
        .snowflake:nth-child(17) { left: 18%; animation-duration: 9s; animation-delay: 2.5s; font-size: 3.4rem; }
        .snowflake:nth-child(18) { left: 28%; animation-duration: 11s; animation-delay: 1.2s; font-size: 2.6rem; }
        .snowflake:nth-child(19) { left: 38%; animation-duration: 14s; animation-delay: 3.8s; font-size: 3.8rem; }
        .snowflake:nth-child(20) { left: 48%; animation-duration: 10s; animation-delay: 0.8s; font-size: 3.1rem; }
        .snowflake:nth-child(21) { left: 58%; animation-duration: 12s; animation-delay: 2.2s; font-size: 2.9rem; }
        .snowflake:nth-child(22) { left: 68%; animation-duration: 8s; animation-delay: 1.8s; font-size: 3.5rem; }
        .snowflake:nth-child(23) { left: 78%; animation-duration: 15s; animation-delay: 0.2s; font-size: 2.7rem; }
        .snowflake:nth-child(24) { left: 88%; animation-duration: 9s; animation-delay: 3.2s; font-size: 3.3rem; }
        .snowflake:nth-child(25) { left: 98%; animation-duration: 11s; animation-delay: 1.5s; font-size: 3rem; }
        .snowflake:nth-child(26) { left: 12%; animation-duration: 13s; animation-delay: 2.8s; font-size: 2.5rem; }
        .snowflake:nth-child(27) { left: 22%; animation-duration: 10s; animation-delay: 0.6s; font-size: 3.6rem; }
        .snowflake:nth-child(28) { left: 42%; animation-duration: 14s; animation-delay: 3.5s; font-size: 2.8rem; }
        .snowflake:nth-child(29) { left: 62%; animation-duration: 9s; animation-delay: 1.1s; font-size: 3.2rem; }
        .snowflake:nth-child(30) { left: 82%; animation-duration: 12s; animation-delay: 2.6s; font-size: 3.4rem; }
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}
