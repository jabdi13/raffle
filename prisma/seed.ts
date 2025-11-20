import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createDatabasePool } from '../src/lib/db-config'
import 'dotenv/config'

const pool = createDatabasePool()
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Resetting database...')

  // Clear existing data
  await prisma.item.updateMany({ data: { winnerId: null } })
  await prisma.raffleState.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.item.deleteMany()

  // Initialize empty raffle state
  await prisma.raffleState.create({
    data: {
      currentItemId: null,
      status: 'waiting'
    }
  })

  console.log('Database reset complete! Ready for new raffle.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
