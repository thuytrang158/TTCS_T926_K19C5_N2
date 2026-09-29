"use client";

import { useMemo, useState } from "react";
import type { SeatPublic } from "@/lib/types";
import { TIER_COLORS, TIER_LABELS } from "@/lib/types";

interface SeatMapGridProps {
  seats: SeatPublic[];
  showLegend?: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function SeatMapGrid({
  seats,
  showLegend = true,
}: SeatMapGridProps) {
  const [hoveredSeat, setHoveredSeat] = useState<SeatPublic | null>(null);

  // Group seats by row
  const rows = useMemo(() => {
    const map = new Map<string, SeatPublic[]>();
    for (const seat of seats) {
      const list = map.get(seat.row) || [];
      list.push(seat);
      map.set(seat.row, list);
    }

    // Sort rows alphabetically
    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((key) => ({
      row: key,
      seats: map.get(key)!.sort((a, b) => a.number - b.number),
    }));
  }, [seats]);

  // Tier counts
  const stats = useMemo(() => {
    const counts: Record<string, { total: number; price: number }> = {};
    for (const s of seats) {
      if (!counts[s.tier]) {
        counts[s.tier] = { total: 0, price: s.price };
      }
      counts[s.tier].total++;
    }
    return counts;
  }, [seats]);

  if (seats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Legend & Stats */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-brand-darker border border-brand-border text-sm">
          <div className="flex flex-wrap items-center gap-5">
            {Object.entries(stats).map(([tier, stat]) => (
              <div key={tier} className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded"
                  style={{ backgroundColor: TIER_COLORS[tier] || "#888" }}
                />
                <span className="text-gray-300 font-medium">
                  {TIER_LABELS[tier] || tier}:
                </span>
                <span className="text-white font-bold">{stat.total} ghế</span>
                <span className="text-xs text-brand-muted">
                  ({formatPrice(stat.price)})
                </span>
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold text-brand-muted">
            Tổng cộng: <strong className="text-white">{seats.length}</strong> ghế
          </div>
        </div>
      )}

      {/* Stage Banner */}
      <div className="relative">
        <div className="mx-auto max-w-lg h-10 rounded-b-3xl bg-gradient-to-b from-brand-orange/30 via-brand-orange/10 to-transparent border-t-2 border-brand-orange flex items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">
            ★ SÂN KHẤU / STAGE ★
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-fit mx-auto flex flex-col items-center gap-2 py-4">
          {rows.map(({ row, seats: rowSeats }) => (
            <div key={row} className="flex items-center gap-3">
              {/* Row Label (Left) */}
              <span className="w-6 text-center text-xs font-bold text-brand-muted">
                {row}
              </span>

              {/* Seats in row */}
              <div className="flex items-center gap-1.5">
                {rowSeats.map((seat) => {
                  const color = TIER_COLORS[seat.tier] || "#6b7280";

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      style={{
                        backgroundColor: color,
                        borderColor: color,
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white transition-all duration-150 shadow-sm hover:scale-110 hover:shadow-md cursor-pointer"
                      title={`${seat.row}${seat.number} - ${seat.tier} - ${formatPrice(seat.price)}`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>

              {/* Row Label (Right) */}
              <span className="w-6 text-center text-xs font-bold text-brand-muted">
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover Tooltip / Detail Bar */}
      {hoveredSeat ? (
        <div className="p-3 rounded-xl bg-brand-darker border border-brand-border flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: TIER_COLORS[hoveredSeat.tier] }}
            />
            <span className="font-bold text-white">
              Vị trí: Hàng {hoveredSeat.row}, Số {hoveredSeat.number}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-brand-card text-brand-muted border border-brand-border">
              {hoveredSeat.tier}
            </span>
          </div>
          <span className="text-brand-orange font-bold">
            {formatPrice(hoveredSeat.price)}
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-brand-darker/40 border border-brand-border/40 text-center text-xs text-brand-muted">
          Rê chuột lên ghế để xem chi tiết hạng vé và giá tiền
        </div>
      )}
    </div>
  );
}
