import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const participants = await prisma.participant.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(participants)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support both single participant and array of participants
    if (Array.isArray(body)) {
      const participants = await prisma.participant.createMany({
        data: body.map((p: { name: string; identifier?: string }) => ({
          name: p.name,
          identifier: p.identifier || null
        }))
      })
      return NextResponse.json({ count: participants.count }, { status: 201 })
    }

    const { name, identifier } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const participant = await prisma.participant.create({
      data: {
        name,
        identifier: identifier || null
      }
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    await prisma.participant.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    )
  }
}
