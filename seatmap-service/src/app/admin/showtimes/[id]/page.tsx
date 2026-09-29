"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  AlertCircle,
  Armchair,
  Upload,
} from "lucide-react";
import SeatMapUploader from "@/components/SeatMapUploader";
import SeatMapGrid from "@/components/SeatMapGrid";

interface ShowtimeData {
  showtime: {
    id: string;
    status: string;
    startTime: string;
    event: {
      id: string;
      title: string;
    };
  };
  seats: {
    id: string;
    row: string;
    number: number;
    tier: string;
    price: number;
    status: string;
  }[];
  tierSummary: {
    tier: string;
    total: number;
    available: number;
    price: number;
  }[];
  totalSeats: number;
}

type Tab = "upload" | "seatmap";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function AdminShowtimeSeatMapPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ShowtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/showtimes/${id}/seatmap`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Không thể tải thông tin");
        return;
      }
      const result = await res.json();
      setData(result);
      if (result.totalSeats > 0) {
        setActiveTab("seatmap");
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-brand-orange animate-spin mb-3" />
        <p className="text-brand-muted">Đang tải...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Lỗi</h3>
        <p className="text-brand-muted mb-4">{error || "Không có dữ liệu"}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-brand-orange hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </a>
      </div>
    );
  }

  const { showtime, seats, tierSummary, totalSeats } = data;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "upload", label: "Nạp sơ đồ ghế (S-05 & S-06)", icon: <Upload className="w-4 h-4" /> },
    { key: "seatmap", label: `Xem sơ đồ ghế (${totalSeats} ghế)`, icon: <Armchair className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <a
        href="/"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-orange transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách suất diễn
      </a>

      {/* Header Info */}
      <div className="rounded-2xl bg-brand-card border border-brand-border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">
              {showtime.event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-brand-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-orange" />
                {formatDate(showtime.startTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-brand-cyan" />
                {totalSeats} ghế đã nạp
              </span>
              <span className="font-mono text-[11px] text-brand-muted/60">
                ID: {showtime.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700/60 text-gray-200 border border-gray-600">
              Trạng thái: {showtime.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tier Summary Cards (if seats exist) */}
      {tierSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tierSummary.map((tier) => (
            <div
              key={tier.tier}
              className={`rounded-xl border p-4 flex items-center justify-between ${
                tier.tier === "SVIP"
                  ? "bg-red-500/5 border-red-500/20"
                  : tier.tier === "VIP"
                  ? "bg-yellow-500/5 border-yellow-500/20"
                  : "bg-blue-500/5 border-blue-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded ${
                    tier.tier === "SVIP"
                      ? "bg-red-500"
                      : tier.tier === "VIP"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <div>
                  <p className="font-bold text-white">{tier.tier}</p>
                  <p className="text-xs text-brand-muted">
                    {tier.total} ghế
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-brand-orange">
                {formatPrice(tier.price)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-brand-darker border border-brand-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${
                activeTab === tab.key
                  ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                  : "text-gray-400 hover:text-white hover:bg-brand-card"
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-brand-card border border-brand-border p-6 min-h-[400px]">
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                📁 Nạp sơ đồ ghế từ file JSON (S-05 & S-06)
              </h3>
              <p className="text-sm text-brand-muted">
                Upload file JSON chứa mảng ghế. Hệ thống sẽ kiểm tra cú pháp, dung lượng, tính hợp lệ và vị trí trùng trước khi lưu toàn bộ trong 1 Transaction.
              </p>
            </div>
            <SeatMapUploader
              showtimeId={showtime.id}
              onUploadSuccess={fetchData}
            />
          </div>
        )}

        {activeTab === "seatmap" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">
              💺 Sơ đồ ghế trực quan (S-06 Preview Grid)
            </h3>
            {seats.length === 0 ? (
              <div className="text-center py-16 text-brand-muted">
                <Armchair className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Chưa có sơ đồ ghế nào được nạp</p>
                <p className="text-sm mt-1">
                  Chuyển sang tab &quot;Nạp sơ đồ ghế&quot; để tải file JSON lên
                </p>
              </div>
            ) : (
              <SeatMapGrid seats={seats} showLegend={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
