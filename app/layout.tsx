import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ui/Toast';

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
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
