import 'dotenv/config'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './src/lib/prisma'

const port = parseInt(process.env.SOCKET_PORT || process.env.PORT || '3001', 10)

const httpServer = createServer()

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Socket.io event handlers
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id)

  // Send current state on connection
  const state = await getRaffleState()
  socket.emit('sync-state', state)

  // Handle record-winner event (creates item + winner together)
  socket.on('record-winner', async (data: { itemName: string, winnerName: string }) => {
    try {
      const result = await recordWinner(data.itemName, data.winnerName)
      io.emit('sync-state', result)
    } catch (error) {
      socket.emit('error', { message: (error as Error).message })
    }
  })

  // Handle update-winner event (updates existing item + winner)
  socket.on('update-winner', async (data: { itemId: number, itemName: string, winnerName: string }) => {
    try {
      const result = await updateWinner(data.itemId, data.itemName, data.winnerName)
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
  console.log(`> Socket.io server ready on port ${port}`)
  console.log(`> Allowed origins: ${process.env.ALLOWED_ORIGINS || '*'}`)
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

  const totalItems = await prisma.item.count()
  const assignedItems = await prisma.item.count({
    where: { winnerId: { not: null } }
  })

  return {
    currentItem,
    history,
    status: raffleState.status,
    progress: { current: assignedItems, total: totalItems }
  }
}

async function recordWinner(itemName: string, winnerName: string) {
  // Get the next order number
  const lastItem = await prisma.item.findFirst({
    orderBy: { order: 'desc' }
  })
  const nextOrder = (lastItem?.order || 0) + 1

  // Create participant
  const winner = await prisma.participant.create({
    data: {
      name: winnerName,
      hasWon: true
    }
  })

  // Create item with winner
  const item = await prisma.item.create({
    data: {
      name: itemName,
      order: nextOrder,
      winnerId: winner.id,
      raffledAt: new Date()
    }
  })

  // Update raffle state to point to new item
  let raffleState = await prisma.raffleState.findFirst()
  if (raffleState) {
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: { currentItemId: item.id }
    })
  } else {
    await prisma.raffleState.create({
      data: {
        currentItemId: item.id,
        status: 'waiting'
      }
    })
  }

  return getRaffleState()
}

async function updateWinner(itemId: number, itemName: string, winnerName: string) {
  // Get the item
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { winner: true }
  })

  if (!item) {
    throw new Error('Item not found')
  }

  // Update item name
  await prisma.item.update({
    where: { id: itemId },
    data: { name: itemName }
  })

  // Update winner name
  if (item.winnerId) {
    await prisma.participant.update({
      where: { id: item.winnerId },
      data: { name: winnerName }
    })
  }

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
    // No more items, clear current item for new entry
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: { currentItemId: null }
    })
  } else {
    await prisma.raffleState.update({
      where: { id: raffleState.id },
      data: { currentItemId: nextItem.id }
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
  // Delete all items
  await prisma.item.deleteMany()

  // Delete all participants (they're created on the fly)
  await prisma.participant.deleteMany()

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
