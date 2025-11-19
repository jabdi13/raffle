import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.raffleState.deleteMany()
  await prisma.item.deleteMany()
  await prisma.participant.deleteMany()

  // Create sample items
  const items = [
    { name: 'PlayStation 5', imageUrl: '/images/ps5.jpg', order: 1 },
    { name: 'iPhone 15 Pro', imageUrl: '/images/iphone.jpg', order: 2 },
    { name: 'MacBook Air M3', imageUrl: '/images/macbook.jpg', order: 3 },
    { name: 'Nintendo Switch OLED', imageUrl: '/images/switch.jpg', order: 4 },
    { name: 'AirPods Pro', imageUrl: '/images/airpods.jpg', order: 5 },
    { name: 'Apple Watch Series 9', imageUrl: '/images/watch.jpg', order: 6 },
    { name: 'iPad Pro 12.9"', imageUrl: '/images/ipad.jpg', order: 7 },
    { name: 'Sony WH-1000XM5', imageUrl: '/images/headphones.jpg', order: 8 },
    { name: 'Amazon Echo Show', imageUrl: '/images/echo.jpg', order: 9 },
    { name: 'Kindle Paperwhite', imageUrl: '/images/kindle.jpg', order: 10 },
  ]

  for (const item of items) {
    await prisma.item.create({ data: item })
  }
  console.log(`Created ${items.length} items`)

  // Create sample participants
  const participants = [
    { name: 'John Smith', identifier: 'A001' },
    { name: 'Maria Garcia', identifier: 'A002' },
    { name: 'David Johnson', identifier: 'A003' },
    { name: 'Sarah Williams', identifier: 'A004' },
    { name: 'Michael Brown', identifier: 'A005' },
    { name: 'Emily Davis', identifier: 'A006' },
    { name: 'James Wilson', identifier: 'A007' },
    { name: 'Jennifer Martinez', identifier: 'A008' },
    { name: 'Robert Anderson', identifier: 'A009' },
    { name: 'Lisa Taylor', identifier: 'A010' },
    { name: 'William Thomas', identifier: 'A011' },
    { name: 'Elizabeth Jackson', identifier: 'A012' },
    { name: 'Christopher White', identifier: 'A013' },
    { name: 'Jessica Harris', identifier: 'A014' },
    { name: 'Daniel Martin', identifier: 'A015' },
    { name: 'Ashley Thompson', identifier: 'A016' },
    { name: 'Matthew Garcia', identifier: 'A017' },
    { name: 'Amanda Robinson', identifier: 'A018' },
    { name: 'Andrew Clark', identifier: 'A019' },
    { name: 'Stephanie Rodriguez', identifier: 'A020' },
  ]

  for (const participant of participants) {
    await prisma.participant.create({ data: participant })
  }
  console.log(`Created ${participants.length} participants`)

  // Initialize raffle state
  const firstItem = await prisma.item.findFirst({ orderBy: { order: 'asc' } })
  await prisma.raffleState.create({
    data: {
      currentItemId: firstItem?.id || null,
      status: 'waiting'
    }
  })
  console.log('Initialized raffle state')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
