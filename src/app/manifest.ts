import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brain Dojo — ฝึกคิดด้วยตัวเอง",
    short_name: "Brain Dojo",
    description: "เกมฝึกสมอง แก้โจทย์ และแก้ปัญหาเฉพาะหน้า",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff6e0",
    theme_color: "#fff6e0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
