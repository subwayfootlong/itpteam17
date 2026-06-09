import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner Benefits | Pergas Member Portal",
  description:
    "Discover exclusive Pergas member benefits from partner merchants across Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
