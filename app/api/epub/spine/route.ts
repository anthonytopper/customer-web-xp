import { NextRequest, NextResponse } from "next/server";
import { Epub } from "@/lib/epub/epub";
import { join } from "path";
import { auth0 } from "@/lib/auth/auth0";

const BIBLE_ROOT = join(process.cwd(), "data", "epub", "bible");

export async function GET(request: NextRequest) {
  try {
    const authSession = await auth0.getSession();
    if (!authSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");

    if (indexParam !== null) {
      // Handle index query parameter - return HTML from spineFile
      const index = parseInt(indexParam, 10);
      
      if (isNaN(index)) {
        return NextResponse.json(
          { error: "Invalid index parameter. Must be a number." },
          { status: 400 }
        );
      }

      const epub = await Epub.open(BIBLE_ROOT);
      const html = await epub.spineFile(index);

      if (html === null) {
        return NextResponse.json(
          { error: `No spine file found at index ${index}` },
          { status: 404 }
        );
      }

      return new NextResponse(html, {
        headers: {
          // Note: do not use text/html
          // self closing XML tags (e.g. <span/>) will not be parsed correctly for text/html
          "Content-Type": "text/xml; charset=utf-8",
        },
      });
    }

    // If no index parameter, return error
    return NextResponse.json(
      { error: "Missing index query parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in spine route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
