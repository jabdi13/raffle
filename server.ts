import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './src/lib/prisma'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Socket.io event handlers
  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id)

    // Send current state on connection
    const state = await getRaffleState()
    socket.emit('sync-state', state)

    // Handle raffle event
    socket.on('raffle', async () => {
      try {
        const result = await performRaffle()
        io.emit('sync-state', result)
      } catch (error) {
        socket.emit('error', { message: (error as Error).message })
      }
    })

    // Handle next item event
    socket.on('next', async () => {
      try {
        const result = await moveToNextItem()
        io.emit('sync-state', result)
      } catch (error) {
        socket.emit('error', { message: (error as Error).message })
      }
    })

    // Handle previous item event
    socket.on('previous', async () => {
      try {
        const result = await moveToPreviousItem()
        io.emit('sync-state', result)
      } catch (error) {
        socket.emit('error', { message: (error as Error).message })
      }
    })

    // Handle reset event
    socket.on('reset', async () => {
      try {
        const result = await resetRaffle()
        io.emit('sync-state', result)
      } catch (error) {
        socket.emit('error', { message: (error as Error).message })
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

// Helper functions for raffle logic
async function getRaffleState() {
  let raffleState = await prisma.raffleState.findFirst()

  if (!raffleState) {
    // Initialize raffle state with first item
    const firstItem = await prisma.item.findFirst({ orderBy: { order: 'asc' } })
    raffleState = await prisma.raffleState.create({
      data: {
        currentItemId: firstItem?.id || null,
        status: 'waiting'
      }
    })
  }

  const currentItem = raffleState.currentItemId
    ? await prisma.item.findUnique({
        where: { id: raffleState.currentItemId },
        include: { winner: true }
      })
    : null

  const history = await prisma.item.findMany({
    where: { winnerId: { not: null } },
    include: { winner: true },
    orderBy: { raffledAt: 'desc' }
  })

  const remainingParticipants = await prisma.participant.count({
    where: { hasWon: false }
  })

  const totalItems = await prisma.item.count()
  const raffledItems = await prisma.item.count({
    where: { winnerId: { not: null } }
  })

  return {
    currentItem,
    history,
    status: raffleState.status,
    remainingParticipants,
    progress: { current: raffledItems, total: totalItems }
  }
}

async function performRaffle() {
  const raffleState = await prisma.raffleState.findFirst()
  if (!raffleState || !raffleState.currentItemId) {
    throw new Error('No item to raffle')
  }

  // Check if current item already has a winner
  const currentItem = await prisma.item.findUnique({
    where: { id: raffleState.currentItemId }
  })

  if (currentItem?.winnerId) {
    throw new Error('Item already raffled')
  }

  // Get eligible participants (those who haven't won)
  const eligibleParticipants = await prisma.participant.findMany({
    where: { hasWon: false }
  })

  if (eligibleParticipants.length === 0) {
    throw new Error('No eligible participants remaining')
  }

  // Select random winner
  const randomIndex = Math.floor(Math.random() * eligibleParticipants.length)
  const winner = eligibleParticipants[randomIndex]

  // Update item with winner
  await prisma.item.update({
    where: { id: raffleState.currentItemId },
    data: {
      winnerId: winner.id,
      raffledAt: new Date()
    }
  })

  // Mark participant as having won
  await prisma.participant.update({
    where: { id: winner.id },
    data: { hasWon: true }
  })

  // Update raffle state
  await prisma.raffleState.update({
    where: { id: raffleState.id },
    data: { status: 'raffling' }
  })

  return getRaffleState()
}

async function moveToNextItem() {
  const raffleState = await prisma.raffleState.findFirst()
  if (!raffleState) {
    throw new Error('Raffle not initialized')
  }

  const currentItem = raffleState.currentItemId
    ? await prisma.item.findUnique({ where: { id: raffleState.currentItemId } })
    : null

  const nextItem = await prisma.item.findFirst({
    where: { order: { gt: currentItem?.order || 0 } },
    orderBy: { order: 'asc' }
  })

  if (!nextItem) {
    // No more items, raffle is complete
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: { status: 'completed' }
    })
  } else {
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: {
        currentItemId: nextItem.id,
        status: 'waiting'
      }
    })
  }

  return getRaffleState()
}

async function moveToPreviousItem() {
  const raffleState = await prisma.raffleState.findFirst()
  if (!raffleState) {
    throw new Error('Raffle not initialized')
  }

  const currentItem = raffleState.currentItemId
    ? await prisma.item.findUnique({ where: { id: raffleState.currentItemId } })
    : null

  const previousItem = await prisma.item.findFirst({
    where: { order: { lt: currentItem?.order || Infinity } },
    orderBy: { order: 'desc' }
  })

  if (previousItem) {
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: {
        currentItemId: previousItem.id,
        status: 'waiting'
      }
    })
  }

  return getRaffleState()
}

async function resetRaffle() {
  // Reset all items
  await prisma.item.updateMany({
    data: { winnerId: null, raffledAt: null }
  })

  // Reset all participants
  await prisma.participant.updateMany({
    data: { hasWon: false }
  })

  // Reset raffle state to first item
  const firstItem = await prisma.item.findFirst({ orderBy: { order: 'asc' } })

  await prisma.raffleState.deleteMany()
  await prisma.raffleState.create({
    data: {
      currentItemId: firstItem?.id || null,
      status: 'waiting'
    }
  })

  return getRaffleState()
}
