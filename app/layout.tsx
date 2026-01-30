import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./ui/navbar";

const displayFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const bodyFont = Work_Sans({ subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "HN → Action",
  description:
    "Human-curated AI discussions from Hacker News and Reddit, turned into short Build This experiments.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "HN → Action",
    description:
      "Human-curated AI discussions from Hacker News and Reddit, turned into short Build This experiments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.className} ${displayFont.className}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
