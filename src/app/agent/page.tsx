'use client'

import { useEffect, useState } from 'react'
import { getSocket, RaffleState } from '@/lib/socket'

export default function AgentPage() {
  const [state, setState] = useState<RaffleState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [itemName, setItemName] = useState('')
  const [winnerName, setWinnerName] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    socket.on('sync-state', (newState: RaffleState) => {
      setState(newState)
      setIsLoading(false)

      // Populate form with current item data for editing
      if (newState.currentItem) {
        setItemName(newState.currentItem.name)
        setWinnerName(newState.currentItem.winner?.name || '')
        setIsEditMode(true)
      } else {
        setItemName('')
        setWinnerName('')
        setIsEditMode(false)
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || !winnerName.trim()) {
      setError('Both item name and winner name are required')
      setTimeout(() => setError(null), 3000)
      return
    }
    setIsLoading(true)

    if (isEditMode && state?.currentItem) {
      // Update existing item
      getSocket().emit('update-winner', {
        itemId: state.currentItem.id,
        itemName: itemName.trim(),
        winnerName: winnerName.trim()
      })
    } else {
      // Record new item
      getSocket().emit('record-winner', {
        itemName: itemName.trim(),
        winnerName: winnerName.trim()
      })
      // Clear form for new entry
      setItemName('')
      setWinnerName('')
    }
  }

  const handleNew = () => {
    setItemName('')
    setWinnerName('')
    setIsEditMode(false)
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
    if (confirm('Are you sure you want to clear all records?')) {
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
      <div className="max-w-4xl mx-auto">
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
              Clear All
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isEditMode ? 'Edit Record' : 'Record New Winner'}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={handleNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
              >
                + New Entry
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium mb-2">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter item name"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="winnerName" className="block text-sm font-medium mb-2">
                Winner Name
              </label>
              <input
                type="text"
                id="winnerName"
                value={winnerName}
                onChange={(e) => setWinnerName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter winner's name"
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !itemName.trim() || !winnerName.trim()}
            className={`w-full px-8 py-4 ${isEditMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'} disabled:opacity-50 rounded-lg text-xl font-bold text-black transition`}
          >
            {isEditMode ? 'Update Record' : 'Record Winner'}
          </button>
        </form>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handlePrevious}
            disabled={isLoading}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-xl transition"
          >
            ← Previous
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
          <h2 className="text-xl font-semibold mb-4">Winner History ({state.history.length})</h2>
          {state.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Winner</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {state.history.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-700 ${state.currentItem?.id === item.id ? 'bg-gray-700' : ''}`}
                    >
                      <td className="p-2">{state.history.length - index}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.winner?.name}</td>
                      <td className="p-2 text-gray-400">
                        {item.raffledAt && new Date(item.raffledAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No winners recorded yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
