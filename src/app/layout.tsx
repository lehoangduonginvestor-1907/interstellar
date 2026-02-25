import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OneSignalInit } from "@/components/OneSignalInit";
import { Starfield } from "@/components/Starfield";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interstellar | Dự báo Quan sát Thiên Văn",
  description: "Công cụ dự báo thời tiết thiên văn chuyên nghiệp dành cho nhà chụp ảnh thiên văn Việt Nam. Mô hình quang học khí quyển Beer-Lambert & Krisciunas-Schaefer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <OneSignalInit />
          <Starfield />
          <div className="relative z-0">
            {children}
          </div>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0c0a1a",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
