import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Find all ACTIVE holds that have expired
    const expiredHolds = await prisma.seatHold.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      include: {
        items: true,
      },
    });

    if (expiredHolds.length === 0) {
      return NextResponse.json({ message: 'No expired holds to release', releasedCount: 0 }, { status: 200 });
    }

    const holdIds = expiredHolds.map((h) => h.id);
    const seatIds = expiredHolds.flatMap((h) => h.items.map((item) => item.seatId));

    // 2. Perform atomic release in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark holds as EXPIRED
      await tx.seatHold.updateMany({
        where: {
          id: { in: holdIds },
          status: 'ACTIVE', // Idempotency check
        },
        data: {
          status: 'EXPIRED',
        },
      });

      // Revert seats to AVAILABLE (only if they are currently HELD, to avoid overwriting BOOKED if somehow that happened)
      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: 'HELD',
        },
        data: {
          status: 'AVAILABLE',
        },
      });
    });

    return NextResponse.json(
      { message: 'Expired holds released successfully', releasedCount: holdIds.length, seatsReleased: seatIds.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error releasing expired holds:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
