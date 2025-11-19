import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      where: { winnerId: { not: null } },
      include: { winner: true },
      orderBy: { order: 'asc' }
    })

    // Generate CSV content
    const csvHeader = 'Order,Item Name,Winner Name,Winner ID,Raffled At\n'
    const csvRows = items.map(item => {
      const raffledAt = item.raffledAt
        ? new Date(item.raffledAt).toLocaleString()
        : ''
      return `${item.order},"${item.name}","${item.winner?.name || ''}","${item.winner?.identifier || ''}","${raffledAt}"`
    }).join('\n')

    const csv = csvHeader + csvRows

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="raffle-results-${Date.now()}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export results' },
      { status: 500 }
    )
  }
}
