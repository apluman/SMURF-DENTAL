import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import CookieBanner from "@/components/CookieBanner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smurf Dental Clinic",
  description: "Expert dental care, beautifully delivered.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // Polyfills for Safari 16 and below
          if (typeof Promise.withResolvers === 'undefined') {
            Promise.withResolvers = function() {
              var resolve, reject;
              var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });
              return { promise: promise, resolve: resolve, reject: reject };
            };
          }
          if (typeof Array.fromAsync === 'undefined') {
            Array.fromAsync = async function(iter) {
              var result = [];
              for await (var item of iter) result.push(item);
              return result;
            };
          }
          if (typeof structuredClone === 'undefined') {
            structuredClone = function(val) { return JSON.parse(JSON.stringify(val)); };
          }
        `}} />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
        <CookieBanner />
      </body>
    </html>
  );
}
