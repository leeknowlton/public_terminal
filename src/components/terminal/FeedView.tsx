"use client";

import { useReadContract } from "wagmi";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";
import MessageCard from "./MessageCard";

interface FeedViewProps {
  count?: number;
  compact?: boolean;
  showRefresh?: boolean;
}

export default function FeedView({ count = 15, compact = false, showRefresh = true }: FeedViewProps) {
  const { data: messages, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getRecentMessages",
    args: [BigInt(count)],
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

      {/* Sticky message - v2 feature */}

      <div className={compact ? "space-y-2" : "space-y-4"}>
        {messageList.map((message) => (
          <MessageCard key={message.id.toString()} message={message} compact={compact} />
        ))}
      </div>
    </div>
  );
}
