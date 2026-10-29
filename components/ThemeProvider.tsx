"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      storageKey="pergas-theme"
      defaultTheme="system"
      enableSystem
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
