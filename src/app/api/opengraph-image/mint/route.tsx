import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";

export const dynamic = "force-dynamic";

const client = createPublicClient({
  chain: base,
  transport: http(),
});

function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

function ensureContrast(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith("#") || hexColor.length !== 7) {
    return "#00FF00";
  }
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#00FF00";
  }
  // If color is too dark (black or near-black), return default green
  if (r < 10 && g < 10 && b < 10) {
    return "#00FF00";
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.15) {
    const factor = 0.4 / luminance;
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  }
  return hexColor;
}

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

type FeedMessage = {
  id: bigint;
  username: string;
  text: string;
  color: string;
  timestamp: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");
  const total = searchParams.get("total");

  // Fallback data passed from client (for when blockchain hasn't propagated yet)
  const fallbackUsername = searchParams.get("username");
  const fallbackText = searchParams.get("text");
  const fallbackColor = searchParams.get("color");
  const fallbackTimestamp = searchParams.get("timestamp");

  // If we have a tokenId, fetch surrounding messages for feed context
  if (tokenId) {
    const targetId = BigInt(tokenId);
    // Fetch 7 messages: 3 before, target, 3 after
    const ids = [
      targetId - 3n, targetId - 2n, targetId - 1n,
      targetId,
      targetId + 1n, targetId + 2n, targetId + 3n
    ].filter(id => id >= 1n);

    // Fetch messages in parallel using multicall
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (client as any).multicall({
      contracts: ids.map(id => ({
        address: CONTRACT_ADDRESS,
        abi: PUBLIC_TERMINAL_ABI,
        functionName: "getMessage",
        args: [id],
      })),
      allowFailure: true,
    });

    // Convert results to feed messages
    const feedMessages: FeedMessage[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "success" && result.result) {
        const msg = result.result as Message;
        feedMessages.push({
          id: ids[i],
          username: msg.username,
          text: msg.text,
          color: ensureContrast(bytes3ToHex(msg.usernameColor)),
          timestamp: formatTimestamp(msg.timestamp),
        });
      }
    }

    // If target message not found in contract, use fallback data from client
    if (!feedMessages.some(m => m.id === targetId) && fallbackUsername && fallbackText) {
      feedMessages.push({
        id: targetId,
        username: fallbackUsername,
        text: fallbackText,
        color: ensureContrast(fallbackColor || "#00FF00"),
        timestamp: fallbackTimestamp || new Date().toISOString().replace("T", " ").slice(0, 16).replace(/-/g, "."),
      });
    }

    // Sort by ID ascending
    feedMessages.sort((a, b) => (a.id < b.id ? -1 : 1));

    // If we got at least the target message, render feed context
    if (feedMessages.some(m => m.id === targetId)) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              backgroundColor: "#1a1a1a",
              padding: "30px 40px",
              fontFamily: "monospace",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#FFFFFF",
                  fontSize: 36,
                  fontWeight: "bold",
                  fontStyle: "italic",
                }}
              >
                Public_Terminal
              </div>
              {total && (
                <div
                  style={{
                    display: "flex",
                    color: "#808080",
                    fontSize: 24,
                  }}
                >
                  {`#${tokenId} of ${total}`}
                </div>
              )}
            </div>

            {/* Feed messages */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
                overflow: "hidden",
              }}
            >
              {feedMessages.slice(0, 7).map((msg) => {
                const isHighlighted = msg.id === targetId;
                return (
                  <div
                    key={msg.id.toString()}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      opacity: isHighlighted ? 1 : 0.5,
                      borderLeft: isHighlighted ? "4px solid #00FF00" : "4px solid transparent",
                      paddingLeft: 12,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }}
                  >
                    {/* Username and message on same line */}
                    <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "1100px" }}>
                      <span
                        style={{
                          color: msg.color,
                          fontSize: 36,
                          fontWeight: "bold",
                        }}
                      >
                        {`<${msg.username}>`}
                      </span>
                      <span
                        style={{
                          color: isHighlighted ? "#E0E0E0" : "#A0A0A0",
                          fontSize: 36,
                          marginLeft: 10,
                        }}
                      >
                        {msg.text.length > 70 ? msg.text.slice(0, 70) + "..." : msg.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                color: "#808080",
                fontSize: 20,
                marginTop: 16,
              }}
            >
              Permanent on-chain transmissions on Base
            </div>
          </div>
        ),
        { width: 1200, height: 800 }
      );
    }
  }

  // Fallback: generic promotional image
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#1a1a1a",
          padding: "50px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#FFFFFF",
            fontSize: 32,
            fontWeight: "bold",
            fontStyle: "italic",
          }}
        >
          Public_Terminal
        </div>
        <div
          style={{
            display: "flex",
            color: "#C0C0C0",
            fontSize: 24,
            marginTop: 40,
            lineHeight: 1.6,
          }}
        >
          Mint a permanent text artifact to the global feed.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 30px",
              border: "2px solid #00FF00",
              backgroundColor: "#1a1a1a",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              MINT
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
