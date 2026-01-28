import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "~/lib/neynar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    if (!fidParam) {
      return NextResponse.json(
        { error: "Missing fid parameter" },
        { status: 400 }
      );
    }

    const fid = Number(fidParam);
    if (!fid || isNaN(fid)) {
      return NextResponse.json(
        { error: "Invalid fid parameter" },
        { status: 400 }
      );
    }

    const client = getNeynarClient();

    // Fetch user's best friends (following list)
    const userResponse = await client.fetchUserFollowingFeed({
      fid,
      limit: 10, // Get top 10 friends
    });

    const bestFriends = (userResponse as any).users || [];

    return NextResponse.json(
      {
        bestFriends: bestFriends.map((user: any) => ({
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300", // 5 min cache
        },
      }
    );
  } catch (error) {
    console.error("Error fetching best friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch best friends" },
      { status: 500 }
    );
  }
}
