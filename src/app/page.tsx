import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Raffle System</h1>
        <p className="text-xl text-gray-300 mb-12">Select your view</p>

        <div className="flex gap-6 justify-center">
          <Link
            href="/agent"
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-xl transition"
          >
            Agent Panel
          </Link>
          <Link
            href="/display"
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 font-bold rounded-lg text-xl transition"
          >
            Public Display
          </Link>
        </div>
      </div>
    </div>
  )
}
