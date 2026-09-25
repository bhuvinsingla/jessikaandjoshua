import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jessika & Joshua — Our Wedding Celebration",
  description:
    "Enter your 10-digit cell phone number to unlock your personalized wedding invitation, schedule, and RSVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Pinyon+Script&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-cream text-brand-dark font-sans antialiased selection:bg-brand-plum selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
