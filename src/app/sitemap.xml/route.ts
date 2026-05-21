import { NextResponse } from "next/server";

const SITE_URL = "https://paladincompliance.com";

const routes = [
  { path: "/", changefreq: "monthly", priority: "1" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/whats-included", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  {
    path: "/verify/paladin-compliance",
    changefreq: "weekly",
    priority: "0.7",
  },
];

export const dynamic = "force-static";

export function GET() {
  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
