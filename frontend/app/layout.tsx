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
  title: "Alumni Hub | Reconnect. Remember. Relive.",
  description: "A private social network exclusively for alumni. Reconnect, remember, and relive old memories with your batch, department, and section.",
  icons: {
    icon: "/AHlogo.png",
    shortcut: "/AHlogo.png",
    apple: "/AHlogo.png",
  },
  openGraph: {
    title: "Alumni Hub | Reconnect. Remember. Relive.",
    description: "A private social network exclusively for alumni. Reconnect, remember, and relive old memories with your batch, department, and section.",
    images: [
      {
        url: "/AHlogo.png",
        width: 500,
        height: 500,
        alt: "Alumni Hub Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white relative">
        {/* Giant Background Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <div 
            className="relative w-[85vw] h-[85vw] max-w-[850px] max-h-[850px] opacity-[0.06] filter blur-[25px]"
            style={{
              backgroundImage: "url('/AHlogo.png')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          />
        </div>
        
        {/* Page Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
