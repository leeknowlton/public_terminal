"use client";

import { useReadContract } from "wagmi";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";
import MessageCard from "./MessageCard";

interface FeedViewProps {
  count?: number;
  compact?: boolean;
  showRefresh?: boolean;
}

// Convert bytes3 color to hex string
function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

export default function FeedView({ count = 15, compact = false, showRefresh = true }: FeedViewProps) {
  const { data: messages, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getRecentMessages",
    args: [BigInt(count)],
  });

  // Fetch sticky message
  const { data: stickyMessage } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getStickyMessage",
  });

  if (isLoading) {
    return (
      <div className={`text-center ${compact ? 'py-4' : 'py-8'} text-terminal-system`}>
        <span className="terminal-loading">Loading feed</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-center ${compact ? 'py-4' : 'py-8'}`}>
        <p className="text-[var(--ansi-red)] text-sm">Error loading feed</p>
        <button
          onClick={() => refetch()}
          className="text-terminal-system hover:text-terminal-text text-sm font-mono mt-2"
        >
          [retry]
        </button>
      </div>
    );
  }

  const messageList = messages as Message[] | undefined;

  if (!messageList || messageList.length === 0) {
    return (
      <div className={`text-center ${compact ? 'py-4' : 'py-8'} text-terminal-system`}>
        <p className="text-sm">No messages yet. Be the first to transmit!</p>
      </div>
    );
  }

  return (
    <div>
      {showRefresh && !compact && (
        <div className="mb-4">
          <button
            onClick={() => refetch()}
            className="text-terminal-system hover:text-terminal-text text-sm font-mono"
          >
            [refresh]
          </button>
        </div>
      )}

      {/* Sticky message at top */}
      {stickyMessage && (stickyMessage as Message).id > 0n && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded mb-4 p-3">
          <div className="text-xs text-yellow-500 font-mono mb-2 uppercase tracking-wider">Pinned</div>
          <div className="font-mono text-xs">
            <span className="text-terminal-system">#{(stickyMessage as Message).id.toString()}</span>
            <span className="text-terminal-system ml-2">
              [{new Date(Number((stickyMessage as Message).timestamp) * 1000).toISOString().replace("T", " ").slice(0, 16).replace(/-/g, ".")}]
            </span>
          </div>
          <div className="font-mono text-xs mt-1">
            <span style={{ color: bytes3ToHex((stickyMessage as Message).usernameColor) }}>
              &lt;{(stickyMessage as Message).username}&gt;
            </span>{" "}
            <span className="text-terminal-text">{(stickyMessage as Message).text}</span>
          </div>
        </div>
      )}

      <div className={compact ? "space-y-2" : "space-y-4"}>
        {messageList.map((message) => (
          <MessageCard key={message.id.toString()} message={message} compact={compact} />
        ))}
      </div>
    </div>
  );
}
