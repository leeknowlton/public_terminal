import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: "FID parameter is required" },
        { status: 400 }
      );
    }

    const cacheKey = `interests:${fid}`;

    // Delete the cache entry
    const result = await kv.del(cacheKey);

    console.log(`Flushed interests cache for FID ${fid}`);

    return NextResponse.json({
      success: true,
      message: `Interests cache flushed for FID ${fid}`,
      deleted: result > 0,
    });
  } catch (error) {
    console.error("Failed to flush interests cache:", error);
    return NextResponse.json(
      { error: "Failed to flush interests cache" },
      { status: 500 }
    );
  }
}
