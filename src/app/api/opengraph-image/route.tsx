import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getNeynarUser } from "~/lib/neynar";

export const dynamic = "force-dynamic";

interface BestFriend {
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
}

// NFT image URL builder
function getNFTImageUrl(fid: number): string {
  return `https://qcntgudzysvobg72.public.blob.vercel-storage.com/warplets/warplet-${fid}.png`;
}

// Check if a warplet image exists
async function warpletExists(fid: number): Promise<boolean> {
  try {
    const url = getNFTImageUrl(fid);
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadGoogleFont(fontName: string, fontWeight: number) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${fontName}:wght@${fontWeight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }
  ).then((res) => res.text());

  // Try different regex patterns
  let fontUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)?.[1];

  if (!fontUrl) {
    fontUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\("woff2"\)/)?.[1];
  }

  if (!fontUrl) {
    fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  }

  if (!fontUrl) {
    throw new Error(`Could not find font URL for ${fontName}. CSS: ${css}`);
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fidParam = searchParams.get("fid");

  // If no FID parameter, return the static og.png
  if (!fidParam) {
    try {
      const ogImagePath = join(process.cwd(), "public", "og.png");
      const imageBuffer = readFileSync(ogImagePath);
      const base64Image = imageBuffer.toString("base64");

      return new ImageResponse(
        (
          <div tw="flex h-full w-full">
            <img
              src={`data:image/png;base64,${base64Image}`}
              alt="Public Terminal"
              width={1200}
              height={630}
              tw="w-full h-full"
            />
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    } catch (error) {
      console.error("Failed to load og.png:", error);
      // Fallback to simple text if image fails to load
      return new ImageResponse(
        (
          <div tw="flex h-full w-full bg-purple-600 items-center justify-center">
            <h1 tw="text-6xl text-white font-bold">Public Terminal</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }
  }

  // If FID parameter is provided, show the share image with user's warplet on left
  const fid = fidParam;
  const fidNum = Number(fid);

  // Fetch user data and best friends in parallel
  const [user, bestFriendsRes] = await Promise.all([
    getNeynarUser(fidNum),
    fetch(
      `${
        process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }/api/best-friends?fid=${fid}`
    ).catch(() => null),
  ]);

  let bestFriends: BestFriend[] = [];

  if (bestFriendsRes?.ok) {
    const data = await bestFriendsRes.json();
    bestFriends = data.bestFriends || [];
  }

  const displayName = user?.display_name || user?.username || "User";
  const username = user?.username || "";

  // Filter to only include friends with minted warplets (matching UI behavior)
  const friendsWithWarplets: BestFriend[] = [];
  for (const friend of bestFriends) {
    if (friendsWithWarplets.length >= 8) break;
    const hasWarplet = await warpletExists(friend.user.fid);
    if (hasWarplet) {
      friendsWithWarplets.push(friend);
    }
  }

  const topFriends = friendsWithWarplets;

  return new ImageResponse(
    (
      <div tw="flex flex-col h-full w-full relative bg-white text-black">
        {/* Title */}
        <div tw="flex justify-center items-center pt-10 px-8 my-20">
          <h2
            tw="text-9xl font-bold text-center"
            style={{ fontFamily: "Outfit" }}
          >
            I just transmitted to the Public Terminal!
          </h2>
        </div>

        {/* Content Section */}
        <div tw="flex w-full p-4">
          {/* Left Section - User Profile */}
          <div tw="flex flex-col w-2/5 justify-center items-center pr-4">
            {/* Warplet Image */}
            <img
              src={getNFTImageUrl(fidNum)}
              alt={displayName}
              width={800}
              height={800}
              tw="mb-6 border border-gray-300 rounded"
            />
          </div>

          {/* Right Section - Best Friends */}
          <div tw="flex flex-col w-3/5 justify-center items-center">
            {/* Best Friends */}
            {topFriends.length > 0 && (
              <div tw="flex flex-col mb-6">
                <div
                  tw="flex px-6 py-0 mb-4"
                  style={{ backgroundColor: "rgb(254, 193, 138)" }}
                >
                  <h2
                    tw="font-bold text-5xl"
                    style={{ color: "rgb(221, 70, 9)", fontFamily: "Outfit" }}
                  >
                    {username}&apos;s Top 8
                  </h2>
                </div>

                <div tw="flex flex-wrap" style={{ width: "100%", gap: "0" }}>
                  {topFriends.map((friend) => (
                    <div
                      key={friend.user.fid}
                      tw="flex flex-col items-center mb-4"
                      style={{ flexBasis: "25%" }}
                    >
                      {/* Friend picture box */}
                      <div tw="flex flex-col">
                        <img
                          src={getNFTImageUrl(friend.user.fid)}
                          alt={friend.user.displayName}
                          width={340}
                          height={340}
                          tw="border border-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div tw="flex justify-between w-full px-20 py-40 items-end">
          {/* Left Footer */}
          <div tw="flex gap-4 items-center align-center">
            <img
              src={`${
                process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
              }/public-terminal-logo.png`}
              alt="Public Terminal"
              width={240}
              tw="mr-8"
            />

            <div tw="flex flex-col">
              <h3
                tw="font-bold text-6xl text-black mb-0"
                style={{ fontFamily: "Outfit" }}
              >
                Public Terminal
              </h3>
              <p
                tw="text-4xl text-black max-w-lg ml-2"
                style={{ fontFamily: "Outfit" }}
              >
                where friends meet
              </p>
            </div>
          </div>
          {/* Right Footer */}
          <div tw="flex flex-col items-end">
            <div
              tw="text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Outfit" }}
            >
              Made by ZENI.ETH
            </div>
            <div
              tw="text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Outfit" }}
            >
              Inspired by HARMONYBOT
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 2400,
      height: 1600,
      fonts: [
        {
          name: "Outfit",
          data: await loadGoogleFont("Outfit", 700),
          weight: 700,
        },
      ],
    }
  );
}
