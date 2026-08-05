import type { Metadata } from "next";
import TopNavbar from "@/components/ui/TopNavbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jatayu — Human Wisdom for Indian Decisions",
  description: "Jatayu connects you with verified experts across India in your language, starting from just ₹49.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500&family=Sora:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TopNavbar />
        {children}
      </body>
    </html>
  );
}


