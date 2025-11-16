import type { Metadata } from "next";
// import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// const jetbrainsMono = JetBrains_Mono({
//   subsets: ["latin"],
//   variable: "--font-jetbrains-mono",
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "BidTranslate - Reverse Auction Platform for Translation Agencies",
  description: "Transform translator sourcing into a fast, transparent auction. Reduce sourcing time from 2+ hours to <15 minutes with 10-15% cost savings.",
  keywords: ["translation", "auction", "translators", "agencies", "Polish", "reverse auction"],
  authors: [{ name: "SmartCamp.AI", url: "https://smartcamp.ai" }],
  openGraph: {
    title: "BidTranslate - Reverse Auction Platform for Translation Agencies",
    description: "Transform translator sourcing into a fast, transparent auction.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
