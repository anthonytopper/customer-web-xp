import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { auth0 } from "@/lib/auth/auth0";

const OEBPS_DIR = join(process.cwd(), "data", "epub", "bible", "OEBPS");

// MIME type mapping for common file types
const MIME_TYPES: Record<string, string> = {
  ".xhtml": "application/xhtml+xml",
  ".html": "text/html",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

function getContentType(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const authSession = await auth0.getSession();
    if (!authSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Join the path segments to get the requested file path
    const requestedPath = (await params).path.join("/");

    // Resolve the full file path within OEBPS directory
    const filePath = join(OEBPS_DIR, requestedPath);

    // Security check: ensure the resolved path is within OEBPS_DIR
    if (!filePath.startsWith(OEBPS_DIR)) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: `File not found: ${requestedPath}` },
        { status: 404 }
      );
    }

    // Read and return the file
    const contentType = getContentType(filePath);
    
    // For text-based files, read as UTF-8; for binary files, read as Buffer
    const isTextFile = [
      ".xhtml", ".html", ".css", ".txt", ".xml"
    ].some(ext => filePath.toLowerCase().endsWith(ext));
    
    const fileContent = isTextFile
      ? await readFile(filePath, "utf-8")
      : await readFile(filePath);

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving static file:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
