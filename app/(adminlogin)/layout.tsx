import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profile Manager",
  description: "Admin panel for managing profiles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
