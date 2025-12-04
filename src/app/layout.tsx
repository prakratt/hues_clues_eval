import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hues & Cues AI Battle",
  description: "Watch AI models compete to guess colors from single-word clues. Built with Vercel AI SDK and AI Gateway for the AI Gateway Hackathon.",
  openGraph: {
    title: "Hues & Cues AI Battle",
    description: "Watch AI models compete to guess colors from single-word clues",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
