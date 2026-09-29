import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const holdSchema = z.object({
  showtimeId: z.string().min(1),
  seatIds: z.array(z.string()).min(1),
  userId: z.string().min(1), // In a real app, this would come from auth session
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = holdSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
    }

    const { showtimeId, seatIds, userId } = result.data;

    try {
      const hold = await prisma.$transaction(async (tx) => {
        // Atomic update: only update if status is AVAILABLE
        const { count } = await tx.seat.updateMany({
          where: {
            id: { in: seatIds },
            status: 'AVAILABLE',
            showtimeId: showtimeId,
          },
          data: {
            status: 'HELD',
          },
        });

        // If the updated count doesn't match the requested count, it means
        // some seats were already held/booked or didn't exist/belong to the showtime.
        console.log(`UpdateMany returned count: ${count}, expected: ${seatIds.length}`);
        if (count !== seatIds.length) {
          throw new Error('CONFLICT');
        }

        // Create the SeatHold record with items
        const newHold = await tx.seatHold.create({
          data: {
            userId,
            showtimeId,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
            items: {
              create: seatIds.map((seatId) => ({ seatId })),
            },
          },
          include: {
            items: true,
          },
        });

        return newHold;
      });

      return NextResponse.json({ message: 'Seats held successfully', hold }, { status: 201 });
    } catch (error: any) {
      const errorStr = String(error);
      if (
        error.message === 'CONFLICT' || 
        error.code === 'P1008' || 
        error.code === 'P2034' || 
        errorStr.includes('timed out') || 
        errorStr.includes('timeout') ||
        errorStr.includes('PrismaClientKnownRequestError')
      ) {
        return NextResponse.json(
          { error: 'One or more requested seats are no longer available or the database is locked. Please try again.' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error holding seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
