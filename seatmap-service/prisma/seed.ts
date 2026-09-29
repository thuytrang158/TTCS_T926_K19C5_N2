import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [seatmap-service] Seeding database...");

  // 1. Chèn sẵn 1 User Ban tổ chức
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@ticket.vn" },
    update: {},
    create: {
      id: "user-1",
      email: "organizer@ticket.vn",
      name: "Ban Tổ Chức Demo",
      role: "ORGANIZER",
    },
  });
  console.log("✅ Created organizer:", organizer.email);

  // 2. Chèn sẵn 1 Event
  const event = await prisma.event.upsert({
    where: { id: "event-1" },
    update: {},
    create: {
      id: "event-1",
      title: "Concert Âm Nhạc Mùa Hè 2026",
      description: "Đêm nhạc hoành tráng với dàn nghệ sĩ hàng đầu. Hệ thống âm thanh, ánh sáng chuẩn quốc tế.",
      venue: "Nhà hát Lớn Hà Nội",
      address: "1 Tràng Tiền, Hoàn Kiếm, Hà Nội",
      imageUrl: "/images/concert-summer.jpg",
      category: "MUSIC",
      minPrice: 300000,
      maxPrice: 2000000,
    },
  });
  console.log("✅ Created event:", event.title);

  // 3. Chèn sẵn 1 Showtime ở trạng thái DRAFT để test nạp ghế (S-05/S-06)
  const showtime = await prisma.showtime.upsert({
    where: { id: "showtime-100" },
    update: {},
    create: {
      id: "showtime-100",
      eventId: "event-1",
      startTime: new Date("2026-10-15T19:00:00"),
      endTime: new Date("2026-10-15T22:00:00"),
      status: "DRAFT",
    },
  });
  console.log("✅ Created showtime (DRAFT):", showtime.id);

  console.log("");
  console.log("🎉 Database [seatmap-service] seeded successfully!");
  console.log("👉 Suất diễn sẵn sàng để test nạp ghế: showtime-100 (Trạng thái: DRAFT, 0 ghế)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
