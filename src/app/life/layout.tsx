import type { Metadata } from "next";
import { Mali } from "next/font/google";

const mali = Mali({ variable: "--font-lq", subsets: ["thai", "latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Weekly Life Quest — Brain Dojo",
  description: "สมุดบันทึกการผจญภัยประจำสัปดาห์",
};

/** Life Quest pages: their own calm pastel ground over Brain Dojo's dotted paper. */
export default function LifeLayout({ children }: LayoutProps<"/life">) {
  return (
    <div className={`lq ${mali.variable}`}>
      <div aria-hidden="true" className="lq-bg fixed inset-0 -z-10" />
      {children}
    </div>
  );
}
