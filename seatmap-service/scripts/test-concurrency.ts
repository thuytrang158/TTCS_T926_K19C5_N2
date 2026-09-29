import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/seat-holds';

async function main() {
  console.log('--- Starting Concurrency Test ---');

  // 1. Get a showtime and some seats
  const showtime = await prisma.showtime.findFirst({
    include: { seats: true },
  });

  if (!showtime) {
    console.error('No showtime found. Please seed the database first.');
    return;
  }

  let seats = showtime.seats;
  if (seats.length === 0) {
    console.log('No seats found, creating dummy seats for testing...');
    await prisma.seat.createMany({
      data: [
        { showtimeId: showtime.id, row: 'A', number: 1, tier: 'VIP', price: 100, status: 'AVAILABLE' },
        { showtimeId: showtime.id, row: 'A', number: 2, tier: 'VIP', price: 100, status: 'AVAILABLE' },
        { showtimeId: showtime.id, row: 'A', number: 3, tier: 'VIP', price: 100, status: 'AVAILABLE' },
      ],
    });
    seats = await prisma.seat.findMany({ where: { showtimeId: showtime.id } });
  }

  // Ensure seats are available
  await prisma.seat.updateMany({
    where: { showtimeId: showtime.id },
    data: { status: 'AVAILABLE' },
  });

  // Pick first 3 seats
  const targetSeats = seats.slice(0, 3).map((s) => s.id);
  console.log(`Targeting seats: ${targetSeats.join(', ')}`);

  // Ensure we have a valid user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'test-concurrency@ticket.vn', name: 'Test User' }
    });
  }

  // 2. Prepare 50 concurrent requests
  const numRequests = 50;
  console.log(`Firing ${numRequests} concurrent requests to hold the same seats...`);

  const requests = Array.from({ length: numRequests }).map(async (_, index) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: showtime.id,
          seatIds: targetSeats,
          userId: user.id, // Using valid user ID
        }),
      });

      const data = await response.json();
      return { status: response.status, data };
    } catch (error: any) {
      return { status: 500, error: error.message };
    }
  });

  // 3. Execute all concurrently
  const results = await Promise.all(requests);

  // 4. Analyze results
  const successCount = results.filter((r) => r.status === 201).length;
  const conflictCount = results.filter((r) => r.status === 409).length;
  const otherStatuses = results.filter((r) => r.status !== 201 && r.status !== 409);
  const otherCount = otherStatuses.length;

  console.log('\n--- Test Results ---');
  console.log(`Successful Holds (201): ${successCount} (Expected: 1)`);
  console.log(`Conflicts (409): ${conflictCount} (Expected: ${numRequests - 1})`);
  console.log(`Other Statuses: ${otherCount} (Expected: 0)`);

  if (otherCount > 0) {
    console.log('Sample of other responses:', otherStatuses.slice(0, 3));
  }

  if (successCount === 1 && conflictCount === numRequests - 1) {
    console.log('✅ Concurrency test PASSED. Locking mechanism works perfectly.');
  } else {
    console.error('❌ Concurrency test FAILED. Check your locking logic.');
  }

  // Verify DB state
  const updatedSeats = await prisma.seat.findMany({
    where: { id: { in: targetSeats } },
  });
  console.log('\nFinal DB Seat Statuses:', updatedSeats.map((s) => s.status));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
