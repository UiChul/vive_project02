import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 한글 글리프용. Geist에 없는 글자는 이 폰트로 대체된다.
const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  preload: false,
});

export const metadata: Metadata = {
  title: "AI/IT Trend Radar",
  description: "GitHub · Reddit AI/IT 트렌드 요약",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${notoKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
