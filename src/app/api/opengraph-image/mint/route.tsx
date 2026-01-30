import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";

export const dynamic = "force-dynamic";

const client = createPublicClient({
  chain: baseSepolia,
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
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.15) {
    const factor = luminance > 0 ? 0.4 / luminance : 3;
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

  // If we have a tokenId, fetch surrounding messages for feed context
  if (tokenId) {
    const targetId = BigInt(tokenId);
    const ids = [targetId - 1n, targetId, targetId + 1n].filter(id => id >= 1n);

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
              padding: "40px 50px",
              fontFamily: "monospace",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#FFFFFF",
                  fontSize: 28,
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
                    fontSize: 20,
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
                gap: 16,
                flex: 1,
              }}
            >
              {feedMessages.map((msg) => {
                const isHighlighted = msg.id === targetId;
                return (
                  <div
                    key={msg.id.toString()}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      opacity: isHighlighted ? 1 : 0.5,
                      borderLeft: isHighlighted ? "3px solid #00FF00" : "3px solid transparent",
                      paddingLeft: 16,
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    {/* ID and timestamp */}
                    <div
                      style={{
                        display: "flex",
                        color: isHighlighted ? "#00FFFF" : "#808080",
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      {`#${msg.id.toString()} [${msg.timestamp}]`}
                    </div>
                    {/* Username and message */}
                    <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "1050px" }}>
                      <span
                        style={{
                          color: msg.color,
                          fontSize: 20,
                          fontWeight: "bold",
                        }}
                      >
                        {`<${msg.username}>`}
                      </span>
                      <span
                        style={{
                          color: isHighlighted ? "#E0E0E0" : "#A0A0A0",
                          fontSize: 20,
                          marginLeft: 8,
                        }}
                      >
                        {msg.text.length > 100 ? msg.text.slice(0, 100) + "..." : msg.text}
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
                fontSize: 16,
                marginTop: 20,
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
