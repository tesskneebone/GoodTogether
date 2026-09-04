import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoodTogether LA",
  description: "Connect with volunteer opportunities across Los Angeles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
