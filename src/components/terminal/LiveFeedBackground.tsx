"use client";

import { useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, type Message } from "~/lib/contractABI";

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
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

interface LiveFeedBackgroundProps {
  children: React.ReactNode;
}

export default function LiveFeedBackground({ children }: LiveFeedBackgroundProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getRecentMessages",
    args: [BigInt(15)],
  });

  const messageList = messages as Message[] | undefined;

  // Auto-scroll effect - slow continuous scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.3; // Slow scroll speed

      // Reset to top when reaching bottom (seamless loop)
      if (scrollPosition >= container.scrollHeight - container.clientHeight) {
        scrollPosition = 0;
      }

      container.scrollTop = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    // Start scrolling after a brief delay
    const timeout = setTimeout(() => {
      animationId = requestAnimationFrame(scroll);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationId);
    };
  }, [messageList]);

  // Refresh feed periodically to catch new messages
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* Live feed background layer */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ opacity: 0.15 }}
      >
        <div className="px-6 py-4 space-y-3">
          {messageList && messageList.length > 0 ? (
            // Duplicate messages for seamless scrolling
            [...messageList, ...messageList].map((message, index) => (
              <div key={`${message.id.toString()}-${index}`} className="py-1">
                <div className="font-mono text-xs flex items-center gap-2">
                  <span className="text-terminal-system">
                    [{formatTimestamp(message.timestamp)}]
                  </span>
                  <span className="text-[var(--ansi-cyan)]">
                    TX#{message.id.toString()}
                  </span>
                </div>
                <div className="font-mono text-xs">
                  <span style={{ color: bytes3ToHex(message.usernameColor) }}>
                    &lt;{message.username}&gt;
                  </span>
                  <span className="text-terminal-text"> {message.text}</span>
                </div>
              </div>
            ))
          ) : (
            // Placeholder text for empty state
            <div className="font-mono text-xs text-terminal-system">
              Awaiting transmissions...
            </div>
          )}
        </div>
      </div>

      {/* Top fade gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, var(--terminal-bg) 0%, transparent 100%)'
        }}
      />

      {/* Bottom fade gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, var(--terminal-bg) 0%, transparent 100%)'
        }}
      />

      {/* Foreground content */}
      <div className="relative z-20 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
