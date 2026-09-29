import type { Metadata } from "next";
import "./globals.css";
import { Armchair, Shield, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "SeatMap Service — Phân hệ Quản lý Sơ đồ Ghế (S-05 & S-06)",
  description:
    "Chuyên trách quản lý nạp file JSON sơ đồ ghế và kiểm tra hiển thị phía Ban tổ chức",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen flex flex-col bg-brand-dark text-slate-100 antialiased selection:bg-brand-orange selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-brand-dark/85 border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center shadow-lg shadow-brand-orange/20">
                <Armchair className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight bg-gradient-to-r from-brand-orange via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                    SeatMap Service
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                    S-05 • S-06
                  </span>
                </div>
                <p className="text-[11px] text-brand-muted font-medium">
                  Ban Tổ Chức • Quản lý Sơ đồ Ghế
                </p>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                BTC: organizer@ticket.vn
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-brand-border/60 bg-brand-darker py-6 text-center text-xs text-brand-muted">
          <p>© 2026 SeatMap Service — Sprint 2 User Stories (S-05 Nạp ghế JSON & S-06 Validate/Xem trước)</p>
        </footer>
      </body>
    </html>
  );
}
