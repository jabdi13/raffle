'use client'

import { useEffect, useState } from 'react'
import { getSocket, RaffleState } from '@/lib/socket'

export default function AgentPage() {
  const [state, setState] = useState<RaffleState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    socket.on('sync-state', (newState: RaffleState) => {
      setState(newState)
      setIsLoading(false)
    })

    socket.on('error', (err: { message: string }) => {
      setError(err.message)
      setIsLoading(false)
      setTimeout(() => setError(null), 3000)
    })

    return () => {
      socket.off('sync-state')
      socket.off('error')
    }
  }, [])

  const handleRaffle = () => {
    setIsLoading(true)
    getSocket().emit('raffle')
  }

  const handleNext = () => {
    setIsLoading(true)
    getSocket().emit('next')
  }

  const handlePrevious = () => {
    setIsLoading(true)
    getSocket().emit('previous')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the entire raffle? This will clear all winners.')) {
      setIsLoading(true)
      getSocket().emit('reset')
    }
  }

  const handleExport = async () => {
    window.open('/api/export', '_blank')
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Connecting to server...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Raffle Control Panel</h1>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Export Results
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Reset Raffle
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Progress */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Progress</span>
            <span>{state.progress.current} / {state.progress.total} items raffled</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(state.progress.current / state.progress.total) * 100 || 0}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {state.remainingParticipants} participants remaining
          </div>
        </div>

        {/* Current Item */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current Item</h2>
          {state.currentItem ? (
            <div className="flex gap-6">
              {state.currentItem.imageUrl && (
                <img
                  src={state.currentItem.imageUrl}
                  alt={state.currentItem.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{state.currentItem.name}</h3>
                <p className="text-gray-400">Order: #{state.currentItem.order}</p>
                {state.currentItem.winner && (
                  <div className="mt-2 p-2 bg-green-600 rounded">
                    Winner: {state.currentItem.winner.name}
                    {state.currentItem.winner.identifier && (
                      <span className="text-green-200"> ({state.currentItem.winner.identifier})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No items available</p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handlePrevious}
            disabled={isLoading}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-xl transition"
          >
            ← Previous
          </button>
          <button
            onClick={handleRaffle}
            disabled={isLoading || state.currentItem?.winner !== null}
            className="px-12 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 rounded-lg text-xl font-bold text-black transition"
          >
            🎲 RAFFLE
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-xl transition"
          >
            Next →
          </button>
        </div>

        {/* History */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Winner History</h2>
          {state.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Winner</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {state.history.map((item) => (
                    <tr key={item.id} className="border-b border-gray-700">
                      <td className="p-2">#{item.order}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">
                        {item.winner?.name}
                        {item.winner?.identifier && (
                          <span className="text-gray-400"> ({item.winner.identifier})</span>
                        )}
                      </td>
                      <td className="p-2 text-gray-400">
                        {item.raffledAt && new Date(item.raffledAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No items raffled yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
