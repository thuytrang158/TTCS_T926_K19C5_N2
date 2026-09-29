/**
 * S-05: Upload Seat Map from JSON file
 * S-06: Validate JSON file and return all errors
 * 
 * POST /api/admin/showtimes/[id]/seatmap
 * GET  /api/admin/showtimes/[id]/seatmap
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSeatMap, validateFileSize } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showtimeId = params.id;

    // 1. Check showtime exists
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        seats: {
          where: { status: { in: ["HELD", "SOLD"] } },
        },
        event: { select: { title: true } },
      },
    });

    if (!showtime) {
      return NextResponse.json(
        { error: "Không tìm thấy suất diễn với ID: " + showtimeId },
        { status: 404 }
      );
    }

    // 2. S-05 Business Rule: Block overwrite if tickets sold or seats held
    if (showtime.seats.length > 0) {
      return NextResponse.json(
        {
          error:
            "Không thể nạp đè sơ đồ ghế: suất diễn đã có vé bán hoặc ghế đang được giữ chỗ",
          details: `${showtime.seats.length} ghế đang ở trạng thái HELD hoặc SOLD`,
        },
        { status: 409 }
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("seatmap") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Không tìm thấy file upload. Vui lòng chọn file JSON." },
        { status: 400 }
      );
    }

    // 4. S-06: Validate file size (< 5MB)
    const sizeError = validateFileSize(file.size);
    if (sizeError) {
      return NextResponse.json({ error: sizeError }, { status: 400 });
    }

    // 5. Read file text
    const text = await file.text();

    // 6. S-06: Validate JSON structure and collect all errors
    const validation = validateSeatMap(text);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "File sơ đồ ghế có lỗi dữ liệu. Vui lòng kiểm tra và sửa lại.",
          errors: validation.errors,
          errorCount: validation.errors.length,
        },
        { status: 422 }
      );
    }

    const seats = validation.seats!;

    // 7. S-05: Insert all seats in a single database transaction
    const startTime = Date.now();

    const result = await prisma.$transaction(async (tx) => {
      // Xóa ghế AVAILABLE cũ nếu có
      const deleted = await tx.seat.deleteMany({
        where: { showtimeId, status: "AVAILABLE" },
      });

      // Tạo đồng loạt tất cả ghế mới trong 1 transaction
      const created = await tx.seat.createMany({
        data: seats.map((s) => ({
          showtimeId,
          row: s.row,
          number: s.number,
          tier: s.tier,
          price: s.price,
          status: "AVAILABLE",
        })),
      });

      return { created: created.count, deleted: deleted.count };
    });

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      message: "Nạp sơ đồ ghế thành công trong 1 Transaction!",
      data: {
        seatsCreated: result.created,
        seatsRemoved: result.deleted,
        showtimeId,
        processingTimeMs: elapsed,
      },
    });
  } catch (error) {
    console.error("Seat map upload error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi nạp sơ đồ ghế" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showtimeId = params.id;

    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        event: { select: { id: true, title: true } },
        seats: {
          orderBy: [{ row: "asc" }, { number: "asc" }],
        },
      },
    });

    if (!showtime) {
      return NextResponse.json(
        { error: "Không tìm thấy suất diễn" },
        { status: 404 }
      );
    }

    // Build tier summary
    const tierMap = new Map<string, { total: number; available: number; price: number }>();
    for (const seat of showtime.seats) {
      const existing = tierMap.get(seat.tier) || { total: 0, available: 0, price: seat.price };
      existing.total++;
      if (seat.status === "AVAILABLE") existing.available++;
      tierMap.set(seat.tier, existing);
    }

    const tierSummary = Array.from(tierMap.entries()).map(([tier, stats]) => ({
      tier,
      ...stats,
    }));

    return NextResponse.json({
      showtime: {
        id: showtime.id,
        status: showtime.status,
        startTime: showtime.startTime,
        event: showtime.event,
      },
      seats: showtime.seats,
      tierSummary,
      totalSeats: showtime.seats.length,
    });
  } catch (error) {
    console.error("Get seatmap error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi lấy thông tin sơ đồ ghế" },
      { status: 500 }
    );
  }
}
