// app/layout.tsx
import "./globals.css";
import { DomainProvider } from "@/components/DomainContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boosting Visualizer",
  description: "Interactive visual explanation of Boosting algorithms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <DomainProvider>{children}</DomainProvider>
      </body>
    </html>
  );
}