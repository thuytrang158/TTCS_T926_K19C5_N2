"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Armchair,
  ExternalLink,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

interface ShowtimeRow {
  id: string;
  eventId: string;
  eventTitle: string;
  venue: string | null;
  category: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  seatCount: number;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function SeatMapDashboard() {
  const [showtimes, setShowtimes] = useState<ShowtimeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/showtimes");
      const data = await res.json();
      setShowtimes(data.data || []);
    } catch (err) {
      console.error("Failed to fetch showtimes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Armchair className="w-7 h-7 text-brand-orange" />
            Quản lý Sơ đồ Ghế Suất Diễn (S-05 & S-06)
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Chọn suất diễn để nạp file sơ đồ ghế JSON (S-05) và kiểm tra hiển thị trực quan (S-06)
          </p>
        </div>
        <button
          onClick={fetchShowtimes}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-card border border-brand-border text-sm text-gray-300 hover:text-white hover:border-brand-orange/50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Guide Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-orange/15 to-amber-500/10 border border-brand-orange/30 p-6">
        <h2 className="text-base font-bold text-brand-orange flex items-center gap-2 mb-2">
          💡 Hướng dẫn kiểm thử Sprint 2:
        </h2>
        <ul className="text-xs sm:text-sm text-gray-300 space-y-1.5 list-disc list-inside">
          <li>
            <strong>S-05 (Nạp ghế):</strong> Suất diễn <code>showtime-100</code> được khởi tạo sẵn ở trạng thái <code>DRAFT</code> (chưa có ghế). Bấm &quot;Nạp Sơ Đồ Ghế&quot; bên dưới để tải lên file JSON.
          </li>
          <li>
            <strong>S-06 (Validate & Preview):</strong> Thử upload file lỗi <code>public/invalid-seatmap.json</code> để kiểm tra danh sách thông báo lỗi chi tiết, hoặc upload file chuẩn <code>public/sample-seatmap.json</code> để xem sơ đồ lưới ghế đầy đủ 3 hạng (SVIP, VIP, Thường).
          </li>
        </ul>
      </div>

      {/* Showtimes Table */}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
            </div>
          ) : showtimes.length === 0 ? (
            <div className="text-center py-20 text-brand-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Chưa có suất diễn nào trong CSDL</p>
              <p className="text-xs text-brand-muted mt-1">Chạy lệnh `npm run db:seed` để tạo suất diễn mẫu</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase">
                    Sự kiện & Suất diễn
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase">
                    Thời gian diễn
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-brand-muted uppercase">
                    Số lượng ghế hiện có
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-brand-muted uppercase">
                    Trạng thái
                  </th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-brand-muted uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map((st) => (
                  <tr
                    key={st.id}
                    className="border-b border-brand-border/50 hover:bg-brand-darker/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white text-sm">
                        {st.eventTitle}
                      </p>
                      {st.venue && (
                        <p className="text-xs text-brand-muted flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {st.venue}
                        </p>
                      )}
                      <p className="text-[11px] text-brand-muted/60 mt-0.5 font-mono">
                        ID: {st.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(st.startTime)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                          st.seatCount > 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        <Armchair className="w-4 h-4" />
                        {st.seatCount > 0 ? `${st.seatCount} ghế` : "Chưa có ghế"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600">
                        {st.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/admin/showtimes/${st.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orangeHover shadow-md shadow-brand-orange/20 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Nạp & Xem Sơ Đồ Ghế
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
