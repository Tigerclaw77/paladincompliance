import type { MetadataRoute } from "next";

const SITE_URL = "https://www.paladincompliance.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/auth/",
        "/checkout/",
        "/dashboard/",
        "/login/",
        "/onboarding/",
        "/order/",
        "/register/",
        "/settings/",
        "/start/",
        "/subscribe/",
        "/success/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
