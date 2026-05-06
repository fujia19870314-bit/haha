import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "哀伤日记 - AI 哀伤引导",
  description: "一个温暖、私密的空间，用 AI 引导你书写哀伤，陪伴你走过失去",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F0EB]">
        {children}
      </body>
    </html>
  );
}
