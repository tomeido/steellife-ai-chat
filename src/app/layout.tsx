import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 배포 환경에 따라 동적으로 설정 (Vercel 등 호스팅 플랫폼 환경 변수 활용)
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

const agentName = "STEELLIFE AI 고객 지원";
const description = "STEELLIFE 제품 및 서비스에 대해 다국어로 문의하세요. 워터웨이브 패널, 스틸 패널 시스템 등 건축용 금속 패널 전문 기업입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: agentName,
  description: description,
  openGraph: {
    title: agentName,
    description: description,
    url: baseUrl,
    siteName: agentName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: agentName,
    description: description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* A2A 검색(Discovery)을 위한 <link rel="agent"> 태그 추가 */}
        <link
          rel="agent"
          type="application/json"
          href="/api/a2a/.well-known/agent.json"
          title="A2A Agent Definition: STEELLIFE AI Customer Service"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}