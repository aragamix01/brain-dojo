import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Mitr } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const body = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

const head = Mitr({
  variable: "--font-head",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Brain Dojo — ฝึกคิดด้วยตัวเอง",
  description: "เกมฝึกสมอง แก้โจทย์ และแก้ปัญหาเฉพาะหน้า ไม่มีเฉลย ไม่มี AI — มีแต่สมองเรา",
  appleWebApp: { capable: true, title: "Brain Dojo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0b1f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${body.variable} ${head.variable} antialiased`}>
      <body className="font-sans">
        <Providers>
          <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
