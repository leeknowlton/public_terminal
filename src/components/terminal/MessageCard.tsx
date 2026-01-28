"use client";

import type { Message } from "~/lib/contractABI";

interface MessageCardProps {
  message: Message;
  compact?: boolean;
}

// Convert bytes3 color to hex string
function bytes3ToHex(color: `0x${string}`): string {
  // color is like "0xFF0000" for red
  // Remove 0x prefix and ensure 6 characters
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

// Format timestamp to match NFT format: [YYYY.MM.DD HH:MM]
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

export default function MessageCard({ message, compact = false }: MessageCardProps) {
  const colorHex = bytes3ToHex(message.usernameColor);

  if (compact) {
    // Compact single-line format for inline previews
    return (
      <div className="font-mono text-xs py-1 flex items-start gap-2">
        <span className="text-[var(--ansi-cyan)] shrink-0">#{message.id.toString()}</span>
        <span style={{ color: colorHex }} className="shrink-0">
          &lt;{message.username}&gt;
        </span>
        <span className="text-terminal-text truncate">{message.text}</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Timestamp and transmission number */}
      <div className="font-mono text-xs flex items-center gap-2">
        <span className="text-terminal-system">
          #{message.id.toString()}
        </span>
        <span className="text-terminal-system">
          [{formatTimestamp(message.timestamp)}]
        </span>
      </div>
      {/* Username + message on next line */}
      <div className="font-mono text-xs">
        <span style={{ color: colorHex }}>
          &lt;{message.username}&gt;
        </span>
        <span className="text-terminal-text"> {message.text}</span>
      </div>
    </div>
  );
}
