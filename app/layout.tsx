import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waspadagempa — Real-time Global Disaster & Climate Risk Map",
  description: "A minimalist, real-time tracking interface for global seismic events and future climate risk scenarios.",
  metadataBase: new URL("https://waspadagempa.vercel.app"),
  openGraph: {
    title: "Waspadagempa — Real-time Global Disaster & Climate Risk Map",
    description: "A minimalist, real-time tracking interface for global seismic events and future climate risk scenarios.",
    url: "https://waspadagempa.vercel.app",
    siteName: "Waspadagempa",
    images: [
      {
        url: "/globe.svg",
        width: 800,
        height: 600,
        alt: "Waspadagempa Map Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waspadagempa — Real-time Global Disaster & Climate Risk Map",
    description: "A minimalist, real-time tracking interface for global seismic events and future climate risk scenarios.",
    images: ["/globe.svg"],
  },
  alternates: {
    canonical: "https://waspadagempa.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh w-screen overflow-hidden flex flex-col m-0 p-0 bg-stone-50 text-stone-900 font-sans">
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Waspadagempa",
              "url": "https://waspadagempa.vercel.app",
              "description": "Real-time global seismic tracking map and future climate risk scenarios visualizer for Indonesia.",
              "applicationCategory": "EmergencyApplication",
              "genre": "seismology",
              "browserRequirements": "Requires JavaScript and HTML5 Canvas.",
              "operatingSystem": "All"
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
