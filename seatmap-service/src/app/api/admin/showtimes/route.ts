import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const showtimes = await prisma.showtime.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            category: true,
          },
        },
        _count: {
          select: { seats: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const data = showtimes.map((st) => ({
      id: st.id,
      eventId: st.event.id,
      eventTitle: st.event.title,
      venue: st.event.venue,
      category: st.event.category,
      startTime: st.startTime,
      endTime: st.endTime,
      status: st.status,
      seatCount: st._count.seats,
      createdAt: st.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Admin showtimes error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lấy danh sách suất diễn" },
      { status: 500 }
    );
  }
}
