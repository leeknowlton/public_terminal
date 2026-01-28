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

// Ensure color has sufficient contrast on dark background
function ensureContrast(hexColor: string): string {
  // Handle missing or invalid colors
  if (!hexColor || !hexColor.startsWith("#") || hexColor.length !== 7) {
    return "#00FF00";
  }

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Handle NaN from invalid hex
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#00FF00";
  }

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance < 0.15) {
    // Lighten the color by scaling up
    const factor = luminance > 0 ? 0.4 / luminance : 3;
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  }

  return hexColor;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");
  const username = searchParams.get("username");
  const text = searchParams.get("text");
  const color = searchParams.get("color");

  let messageData: {
    username: string;
    text: string;
    color: string;
  };

  if (username && text) {
    // Fast path: use query params
    messageData = {
      username,
      text,
      color: color ? ensureContrast(color) : "#00FF00",
    };
  } else if (tokenId) {
    // Fallback: fetch from contract
    try {
      const message = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PUBLIC_TERMINAL_ABI,
        functionName: "getMessage",
        args: [BigInt(tokenId)],
      }) as Message;

      messageData = {
        username: message.username,
        text: message.text,
        color: ensureContrast(bytes3ToHex(message.usernameColor)),
      };
    } catch (error) {
      console.error("Failed to fetch message:", error);
      messageData = {
        username: "anon",
        text: "Message not found",
        color: "#00FF00",
      };
    }
  } else {
    // Generic promotional image when no data provided
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
              color: "#C0C0C0",
              fontSize: 24,
              marginTop: 40,
              lineHeight: 1.6,
            }}
          >
            Mint a permanent text artifact to the global feed. Your message lives forever, signed by your username.
          </div>
          <div
            style={{
              color: "#C0C0C0",
              fontSize: 24,
              marginTop: 30,
              lineHeight: 1.6,
            }}
          >
            Minting generates two tokens: your personal artifact and a dynamic view of the live public feed.
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
                  textDecoration: "underline",
                }}
              >
                MINT
              </span>
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                textDecoration: "underline",
              }}
            >
              Public Feed
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const charCount = messageData.text.length;

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
        {/* Header */}
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: "bold",
            fontStyle: "italic",
          }}
        >
          Public_Terminal
        </div>

        {/* Explanatory text - first paragraph */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 30,
          }}
        >
          <div style={{ color: "#C0C0C0", fontSize: 20, lineHeight: 1.6 }}>
            Mint a permanent text artifact to the global feed. Your message lives forever, signed by your username.
          </div>
        </div>

        {/* Explanatory text - second paragraph */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
          }}
        >
          <div style={{ color: "#C0C0C0", fontSize: 20, lineHeight: 1.6 }}>
            Minting generates two tokens: your personal artifact and a dynamic view of the live public feed.
          </div>
        </div>

        {/* Character count line */}
        <div
          style={{
            color: "#C0C0C0",
            fontSize: 20,
            marginTop: 30,
            lineHeight: 1.6,
          }}
        >
          Here is my {charCount} symbols of truth:
        </div>

        {/* Message area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 20,
            flex: 1,
          }}
        >
          <div style={{ color: "#808080", fontSize: 20 }}>—</div>

          {/* Username and message */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 10,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "1100px" }}>
              <span
                style={{
                  color: messageData.color,
                  fontSize: 22,
                  fontWeight: "bold",
                }}
              >
                &lt;{messageData.username}&gt;
              </span>
              <span
                style={{
                  color: "#C0C0C0",
                  fontSize: 22,
                  marginLeft: 8,
                }}
              >
                {messageData.text}
              </span>
            </div>
          </div>

          <div style={{ color: "#808080", fontSize: 20, marginTop: 10 }}>—</div>
        </div>

        {/* Footer with MINT button and Public Feed */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            marginTop: "auto",
          }}
        >
          {/* MINT button */}
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
                textDecoration: "underline",
              }}
            >
              MINT
            </span>
          </div>

          {/* Public Feed link */}
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              textDecoration: "underline",
            }}
          >
            Public Feed
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
