import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAssetDownloadFilename,
  getAssetDownloadForMember,
} from "@/lib/paladin/assets";
import { logOperationalEvent } from "@/lib/paladin/logging";

export const runtime = "nodejs";

type AssetDownloadRouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: AssetDownloadRouteContext
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { assetId } = await params;

  if (!assetId.trim()) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const download = await getAssetDownloadForMember({
    assetId,
    userEmail: session.user.email,
  });

  if (download.status === "not_found") {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  if (download.status === "locked") {
    return NextResponse.json(
      { error: download.locked.message },
      { status: 403 }
    );
  }

  if (download.status === "storage_missing") {
    return NextResponse.json(
      {
        error:
          "This asset record exists, but the stored file is not currently available.",
      },
      { status: 410 }
    );
  }

  if (download.status === "storage_error") {
    return NextResponse.json(
      { error: "The asset store could not be reached. Please try again." },
      { status: 503 }
    );
  }

  const filename = getAssetDownloadFilename(download.asset);
  const responseBytes = new Uint8Array(download.body.byteLength);
  responseBytes.set(download.body);

  logOperationalEvent("info", "asset_download_started", {
    assetId,
    organizationId: download.asset.organizationId,
  });

  return new NextResponse(responseBytes.buffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${escapeHeaderValue(
        filename
      )}"`,
      "Content-Length": String(download.body.byteLength),
      "Content-Type": getSafeContentType(download.asset.mimeType),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHeaderValue(value: string) {
  return sanitizeDownloadFilename(value).replace(/["\\]/g, "");
}

function sanitizeDownloadFilename(value: string) {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return sanitized || "paladin-asset";
}

function getSafeContentType(mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase().split(";")[0]?.trim();
  const safeMimeTypes = new Set([
    "application/pdf",
    "application/zip",
    "image/png",
    "image/svg+xml",
    "text/plain",
  ]);

  return normalizedMimeType && safeMimeTypes.has(normalizedMimeType)
    ? mimeType
    : "application/octet-stream";
}
