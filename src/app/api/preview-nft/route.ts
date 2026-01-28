import { NextRequest, NextResponse } from "next/server";

// Types
interface MockMessage {
  username: string;
  text: string;
  timestamp: number;
  color: string;
}

// Mock messages for feed preview
const MOCK_MESSAGES: MockMessage[] = [
  { username: "vitalik.eth", text: "The future of Ethereum is looking bright. Layer 2s are scaling beautifully.", timestamp: 1737909240, color: "00FF00" },
  { username: "punk6529", text: "NFTs are not just JPEGs. They are programmable property rights on the internet.", timestamp: 1737908940, color: "FF00FF" },
  { username: "cobie", text: "gm. markets are fake and gay but we're all gonna make it anyway", timestamp: 1737908640, color: "00FFFF" },
  { username: "zeni.eth", text: "Everyone buy $shibacumrocketelon! To the moon 2026 Elon will tweet this confirmed 100%", timestamp: 1737908340, color: "00FF00" },
  { username: "jessepollak", text: "Base is for everyone. Building the global onchain economy one block at a time.", timestamp: 1737908040, color: "0000FF" },
  { username: "dwr.eth", text: "Farcaster is not a social network. It's a protocol for decentralized social apps.", timestamp: 1737907740, color: "FFFF00" },
  { username: "anoncast", text: "sometimes the best conversations happen when nobody knows who you are", timestamp: 1737907440, color: "FF0000" },
  { username: "linda.eth", text: "Art is the only way to run away without leaving home. Minting my thoughts forever.", timestamp: 1737907140, color: "FFA500" },
  { username: "deployer", text: "Just deployed another contract. Gas fees looking good today.", timestamp: 1737906840, color: "00FFFF" },
  { username: "whale.eth", text: "Accumulating. Not financial advice. DYOR. NFA. WAGMI. LFG.", timestamp: 1737906540, color: "FF00FF" },
  { username: "builder", text: "Ship ship ship. That's all we do. Every day we ship.", timestamp: 1737906240, color: "00FF00" },
  { username: "cryptopunk", text: "Been in this space since 2017. Seen it all. Still here. Still building.", timestamp: 1737905940, color: "FFFF00" },
  { username: "anon", text: "hello world from the public terminal", timestamp: 1737905640, color: "0000FF" },
  { username: "based.eth", text: "Onchain summer never ends when you're building on Base", timestamp: 1737905340, color: "FF0000" },
  { username: "gm.eth", text: "gm to everyone except those who don't say gm back", timestamp: 1737905040, color: "FFA500" },
];

// Same date formatting logic as the Solidity contract
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

// XML escape function matching contract
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Generate wrapped text with username on first line
function wrapTextWithUsername(text: string, username: string): string {
  const maxLines = 6;
  const startY = 380;
  const lineHeight = 60;

  // Calculate chars per line accounting for username on first line
  // At 48px font, ~29px per char, 880px usable width = ~30 chars total
  // Username takes: <username> + space = length + 3 chars
  const usernameChars = username.length + 3;
  const firstLineChars = usernameChars < 28 ? 28 - usernameChars : 5; // At least 5 chars for text
  const otherLineChars = 28; // Subsequent lines don't have username

  // Word-wrap the text with variable line widths
  const lines = wordWrapVariable(text, firstLineChars, otherLineChars, maxLines);

  let result = `<text x="60" y="${startY}"><tspan class="usr">&lt;${escapeXml(username)}&gt; </tspan><tspan class="msg">${escapeXml(lines[0] || "")}</tspan></text>`;

  for (let i = 1; i < lines.length; i++) {
    result += `<text x="60" y="${startY + i * lineHeight}" class="msg">${escapeXml(lines[i])}</text>`;
  }

  return result;
}

// Word wrap with variable first line width
function wordWrapVariable(text: string, firstLineWidth: number, otherLineWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (lines.length >= maxLines) break;

    const currentMaxWidth = lines.length === 0 ? firstLineWidth : otherLineWidth;
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= currentMaxWidth) {
      currentLine = testLine;
    } else {
      // Current line is full, push it and start new line
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) break;
      }

      // Handle words longer than line width
      const nextMaxWidth = lines.length === 0 ? firstLineWidth : otherLineWidth;
      if (word.length > nextMaxWidth) {
        let remaining = word;
        while (remaining.length > 0 && lines.length < maxLines) {
          const width = lines.length === 0 ? firstLineWidth : otherLineWidth;
          lines.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }

  // Don't forget the last line
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

// Generate SVG matching the on-chain contract
function generateSVG(
  username: string,
  text: string,
  timestamp: number
): string {
  const wrappedText = wrapTextWithUsername(text, username);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<style>
.title{fill:#FFF;font-family:Courier New,monospace;font-size:24px;font-weight:bold}
.ts{fill:#FFF;font-family:Courier New,monospace;font-size:48px}
.usr{fill:#00FF00;font-family:Courier New,monospace;font-size:48px}
.msg{fill:#FFF;font-family:Courier New,monospace;font-size:48px}
</style>
<rect width="100%" height="100%" fill="#1A1A1A"/>
<text x="60" y="70" class="title">Public_Terminal</text>
<text x="60" y="280" class="ts">[${formatTimestamp(timestamp)}]</text>
${wrappedText}
</svg>`;
}

// Word wrap for feed messages
function wordWrapFeed(text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (lines.length >= maxLines) break;

    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) break;
      }

      if (word.length > maxWidth) {
        let remaining = word;
        while (remaining.length > 0 && lines.length < maxLines) {
          lines.push(remaining.slice(0, maxWidth));
          remaining = remaining.slice(maxWidth);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

// Generate Feed SVG matching the on-chain contract
function generateFeedSVG(messages: MockMessage[]): string {
  const count = Math.min(messages.length, 15);
  let messagesContent = "";
  let yPos = 100;
  const lineHeight = 24;
  const msgSpacing = 20;
  const charsPerLine = 70;

  for (let i = 0; i < count && yPos < 960; i++) {
    const m = messages[i];

    // Timestamp line
    messagesContent += `<text x="40" y="${yPos}" class="ts">[${formatTimestamp(m.timestamp)}]</text>`;
    yPos += lineHeight;

    // Username + message with word wrap
    const fullText = `<${m.username}> ${m.text}`;
    const lines = wordWrapFeed(fullText, charsPerLine, 3);

    for (let j = 0; j < lines.length && yPos < 960; j++) {
      if (j === 0) {
        // First line has colored username
        const usernameLen = m.username.length + 2; // <username> (just < and >)
        const userPart = lines[0].slice(0, usernameLen);
        const msgPart = lines[0].slice(usernameLen);

        messagesContent += `<text x="40" y="${yPos}"><tspan fill="#${m.color}" class="usr">${escapeXml(userPart)}</tspan><tspan class="msg">${escapeXml(msgPart)}</tspan></text>`;
      } else {
        // Continuation lines
        messagesContent += `<text x="40" y="${yPos}" class="msg">${escapeXml(lines[j])}</text>`;
      }
      yPos += lineHeight;
    }

    yPos += msgSpacing;
  }

  if (count === 0) {
    messagesContent = '<text x="40" y="100" class="msg">No transmissions yet...</text>';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<style>
.title{fill:#FFF;font-family:Courier New,monospace;font-size:18px;font-weight:bold}
.ts{fill:#FFF;font-family:Courier New,monospace;font-size:18px}
.usr{font-family:Courier New,monospace;font-size:18px}
.msg{fill:#FFF;font-family:Courier New,monospace;font-size:18px}
</style>
<rect width="100%" height="100%" fill="#1A1A1A"/>
<text x="40" y="50" class="title">Public_Terminal</text>
${messagesContent}
</svg>`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "message";

  if (type === "feed") {
    // Return feed NFT preview with mock data
    const svg = generateFeedSVG(MOCK_MESSAGES);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Default: message NFT preview
  const username = searchParams.get("username") || "anon";
  const text = searchParams.get("text") || "Hello, Public Terminal!";
  const timestamp = parseInt(searchParams.get("timestamp") || String(Math.floor(Date.now() / 1000)));

  const svg = generateSVG(username, text, timestamp);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "message", username = "anon", text = "Hello, Public Terminal!", timestamp = Math.floor(Date.now() / 1000), messages } = body;

    if (type === "feed") {
      const feedMessages = messages || MOCK_MESSAGES;
      const svg = generateFeedSVG(feedMessages);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    const svg = generateSVG(username, text, timestamp);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
