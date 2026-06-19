import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SITE_URL = "https://www.paladincompliance.com";
const SITE_TITLE = "Paladin Compliance";
const SITE_DESCRIPTION =
  "Simple, defensible compliance systems for organizations that need documented AI governance practices.";
const SOCIAL_IMAGE = "/paladincompliance-bg.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Paladin Compliance",
  title: {
    default: SITE_TITLE,
    template: "%s | Paladin Compliance",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_IMAGE,
        alt: "Paladin Compliance governance system",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Paladin Compliance",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_TITLE,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_TITLE,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#020817",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        {posthogKey ? (
          <Script id="posthog" strategy="afterInteractive">
            {`
              window.posthog = window.posthog || [];
              if (!window.posthog.__SV) {
                const posthog = window.posthog;
                const host = ${JSON.stringify(posthogHost)}.replace(/\\/$/, "");
                posthog._i = [];
                posthog.init = function(key, config, name) {
                  const target = name ? (posthog[name] = []) : posthog;
                  target.people = target.people || [];
                  ["capture","identify","reset","register","captureException"].forEach(function(method) {
                    target[method] = function() {
                      target.push([method].concat(Array.prototype.slice.call(arguments)));
                    };
                  });
                  posthog._i.push([key, config, name]);
                };
                posthog.__SV = 1;
                const script = document.createElement("script");
                script.async = true;
                script.src = host + "/static/array.js";
                document.head.appendChild(script);
                posthog.init(${JSON.stringify(posthogKey)}, {
                  api_host: host,
                  person_profiles: "identified_only"
                });
              }
            `}
          </Script>
        ) : null}
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(gaMeasurementId)});
              `}
            </Script>
          </>
        ) : null}
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", ${JSON.stringify(clarityProjectId)});
            `}
          </Script>
        ) : null}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
