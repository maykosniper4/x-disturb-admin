import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReduxProvider } from "@/providers/redux-provider";
import { AdminContextProvider } from "@/components/context-provider";

export const metadata: Metadata = {
  title: "X-Disturb Dashboard",
  description: "Dashboard for X-Disturb performance monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="scrollbar-hide">
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AdminContextProvider>{children}</AdminContextProvider>
          </ThemeProvider>
        </ReduxProvider>

      </body>
    </html>
  );
}
