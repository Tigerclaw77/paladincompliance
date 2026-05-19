import {
  getConfiguredPublicSiteUrl,
  getPublicSiteUrl,
  isDevelopmentRuntime,
  isLocalhostUrl,
} from "@/lib/paladin/env";

export function getSiteOrigin(request?: Request) {
  const configuredUrl = getConfiguredPublicSiteUrl();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      if (request) {
        return getRequestOrigin(request);
      }
    }
  }

  if (request) {
    return getRequestOrigin(request);
  }

  return new URL(getPublicSiteUrl()).origin;
}

function getRequestOrigin(request: Request) {
  const origin = new URL(request.url).origin;

  if (isDevelopmentRuntime() || !isLocalhostUrl(origin)) {
    return origin;
  }

  return new URL(getPublicSiteUrl()).origin;
}

export function getAbsoluteVerificationUrl(slug: string, request?: Request) {
  return `${getSiteOrigin(request)}/verify/${encodeURIComponent(slug)}`;
}

export function getDisplayVerificationUrl(slug: string, request?: Request) {
  const absoluteUrl = getAbsoluteVerificationUrl(slug, request);

  return getDisplayUrlFromAbsoluteUrl(absoluteUrl);
}

export function getDisplayUrlFromAbsoluteUrl(absoluteUrl: string) {
  try {
    const parsedUrl = new URL(absoluteUrl);

    if (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "::1"
    ) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return absoluteUrl;
  } catch {
    return absoluteUrl;
  }
}
