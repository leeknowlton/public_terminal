import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";

export const dynamic = "force-dynamic";

// Create viem client for reading contract
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Convert bytes3 color to hex string
function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

// Format timestamp
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");
  const username = searchParams.get("username");
  const text = searchParams.get("text");
  const color = searchParams.get("color");
  const timestamp = searchParams.get("timestamp");
  const totalCount = searchParams.get("total");

  // If we have query params, use those (faster, no contract call)
  // Otherwise, try to fetch from contract using tokenId
  let messageData: {
    username: string;
    text: string;
    color: string;
    timestamp: string;
    tokenId: string;
    totalCount: string;
  };

  if (username && text) {
    // Use provided params
    messageData = {
      username,
      text,
      color: color || "#00FF00",
      timestamp: timestamp || formatTimestamp(BigInt(Math.floor(Date.now() / 1000))),
      tokenId: tokenId || "???",
      totalCount: totalCount || "???",
    };
  } else if (tokenId) {
    // Fetch from contract
    try {
      const [message, count] = await Promise.all([
        client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: PUBLIC_TERMINAL_ABI,
          functionName: "getMessage",
          args: [BigInt(tokenId)],
        }) as Promise<Message>,
        client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: PUBLIC_TERMINAL_ABI,
          functionName: "getMessageCount",
        }) as Promise<bigint>,
      ]);

      messageData = {
        username: message.username,
        text: message.text,
        color: bytes3ToHex(message.usernameColor),
        timestamp: formatTimestamp(message.timestamp),
        tokenId,
        totalCount: count.toString(),
      };
    } catch (error) {
      console.error("Failed to fetch message:", error);
      // Fallback
      messageData = {
        username: "anon",
        text: "Message not found",
        color: "#00FF00",
        timestamp: formatTimestamp(BigInt(Math.floor(Date.now() / 1000))),
        tokenId: tokenId || "???",
        totalCount: "???",
      };
    }
  } else {
    // No data provided - show generic image
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#1a1a1a",
            padding: "60px",
            fontFamily: "monospace",
          }}
        >
          <div style={{ color: "#FFFFFF", fontSize: 72, fontWeight: "bold" }}>
            PUBLIC_TERMINAL
          </div>
          <div style={{ color: "#808080", fontSize: 36, marginTop: 20 }}>
            Permanent on-chain text artifacts
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Generate the terminal transmission receipt
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          padding: "40px 50px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Scanline overlay effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #333",
            paddingBottom: "20px",
            marginBottom: "30px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#FFFFFF", fontSize: 42, fontWeight: "bold", letterSpacing: 2 }}>
              PUBLIC_TERMINAL
            </div>
            <div style={{ color: "#808080", fontSize: 20, marginTop: 8 }}>
              TRANSMISSION RECEIPT
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ color: "#00FF00", fontSize: 28, fontWeight: "bold" }}>
              TX #{messageData.tokenId}
            </div>
            <div style={{ color: "#808080", fontSize: 18 }}>
              of {messageData.totalCount} transmissions
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div style={{ display: "flex", marginBottom: "20px" }}>
          <div style={{ color: "#808080", fontSize: 24 }}>
            [{messageData.timestamp}]
          </div>
        </div>

        {/* Message content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#151515",
            borderRadius: "8px",
            padding: "30px",
            border: "1px solid #333",
          }}
        >
          {/* Username */}
          <div style={{ display: "flex", marginBottom: "16px" }}>
            <span style={{ color: messageData.color, fontSize: 32, fontWeight: "bold" }}>
              &lt;{messageData.username}&gt;
            </span>
          </div>

          {/* Message text */}
          <div
            style={{
              color: "#C0C0C0",
              fontSize: 36,
              lineHeight: 1.4,
              wordBreak: "break-word",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {messageData.text}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #333",
          }}
        >
          <div style={{ color: "#808080", fontSize: 18 }}>
            Permanent on-chain artifact on Base
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ color: "#00FF00", fontSize: 18 }}>
              VERIFIED
            </div>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#00FF00",
                boxShadow: "0 0 10px #00FF00",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
