"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { validateFileSize } from "@/lib/validators";

interface SeatMapUploaderProps {
  showtimeId: string;
  onUploadSuccess: () => void;
}

interface UploadResponse {
  message?: string;
  data?: {
    seatsCreated: number;
    seatsRemoved: number;
    showtimeId: string;
    processingTimeMs: number;
  };
  error?: string;
  errors?: string[];
  errorCount?: number;
  details?: string;
}

export default function SeatMapUploader({
  showtimeId,
  onUploadSuccess,
}: SeatMapUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (f: File) => {
    setResult(null);
    setClientError(null);

    // Validate size (< 5MB)
    const sizeErr = validateFileSize(f.size);
    if (sizeErr) {
      setClientError(sizeErr);
      setFile(null);
      return;
    }

    if (!f.name.endsWith(".json")) {
      setClientError("Chỉ chấp nhận file định dạng .json");
      setFile(null);
      return;
    }

    setFile(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);
    setClientError(null);

    try {
      const formData = new FormData();
      formData.append("seatmap", file);

      const res = await fetch(`/api/admin/showtimes/${showtimeId}/seatmap`, {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();
      setResult(data);

      if (res.ok) {
        onUploadSuccess();
      }
    } catch {
      setClientError("Lỗi kết nối server khi nạp sơ đồ ghế");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${
            dragActive
              ? "border-brand-orange bg-brand-orange/10 scale-[1.01]"
              : "border-brand-border hover:border-brand-orange/50 hover:bg-brand-card/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold text-white">
              Kéo thả file JSON vào đây hoặc{" "}
              <span className="text-brand-orange underline">chọn từ máy tính</span>
            </p>
            <p className="text-xs text-brand-muted mt-1">
              Định dạng .json, dung lượng tối đa 5MB (S-06)
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Card */}
      {file && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-brand-card border border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-brand-muted">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-brand-darker transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-brand-orange/20 transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang nạp...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Nạp sơ đồ ghế (S-05)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Client-side Error */}
      {clientError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Lỗi</p>
            <p className="text-xs text-red-400/90 mt-0.5">{clientError}</p>
          </div>
        </div>
      )}

      {/* S-06 Error List (from Server Validation) */}
      {result && result.errors && result.errors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-bold">
              Phát hiện {result.errors.length} lỗi trong file JSON (S-06):
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pl-7 pr-2">
            {result.errors.map((err, i) => (
              <div
                key={i}
                className="text-xs text-red-300/90 font-mono bg-red-950/40 px-2.5 py-1.5 rounded border border-red-800/30"
              >
                {err}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Error */}
      {result && result.error && (!result.errors || result.errors.length === 0) && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">{result.error}</p>
            {result.details && (
              <p className="text-xs text-red-400/80 mt-1">{result.details}</p>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {result && result.message && result.data && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              {result.message}
            </p>
            <p className="text-xs text-emerald-400/80 mt-1">
              Đã tạo mới: <strong>{result.data.seatsCreated} ghế</strong> | Đã xóa cũ: {result.data.seatsRemoved} ghế | Xử lý trong: {result.data.processingTimeMs}ms
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
