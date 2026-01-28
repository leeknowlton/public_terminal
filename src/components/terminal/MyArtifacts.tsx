"use client";

import { useReadContract, usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, FEED_TOKEN_OFFSET, type Message } from "~/lib/contractABI";
import MessageCard from "./MessageCard";

interface MyArtifactsProps {
  fid: number;
  address?: `0x${string}`;
}

export default function MyArtifacts({ fid, address }: MyArtifactsProps) {
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "totalSupply",
  });

  useEffect(() => {
    const fetchUserMessages = async () => {
      if (!publicClient || !totalSupply || !fid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const messages: Message[] = [];

      try {
        // Iterate through all tokens and find ones belonging to this FID
        const supply = Number(totalSupply);
        for (let i = 1; i <= supply && i <= 1000; i++) {
          try {
            const result = await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: PUBLIC_TERMINAL_ABI,
              functionName: "messages",
              args: [BigInt(i)],
            }) as [bigint, `0x${string}`, bigint, string, string, bigint, `0x${string}`];

            const [id, author, msgFid, username, text, timestamp, usernameColor] = result;

            if (Number(msgFid) === fid) {
              messages.push({
                id,
                author,
                fid: msgFid,
                username,
                text,
                timestamp,
                usernameColor,
              });
            }
          } catch {
            // Token doesn't exist or error, continue
          }
        }
      } catch (error) {
        console.error("Error fetching user messages:", error);
      }

      setUserMessages(messages.reverse()); // Most recent first
      setIsLoading(false);
    };

    fetchUserMessages();
  }, [publicClient, totalSupply, fid]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-terminal-system">
        <span className="terminal-loading">Loading your artifacts</span>
      </div>
    );
  }

  const hasNFTs = balance && typeof balance === "bigint" && balance > 0n;

  if (!hasNFTs && userMessages.length === 0) {
    return (
      <div className="text-center py-8 text-terminal-system">
        <p>No artifacts yet.</p>
        <p className="mt-2">Mint your first message to create an artifact!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-mono font-bold text-terminal-text">
          My_Artifacts
        </h2>
        <p className="text-terminal-system text-xs font-mono mt-1">
          Each mint creates 2 NFTs: message + feed view
        </p>
      </div>

      <div className="space-y-4">
        {userMessages.map((message) => {
          const messageTokenId = message.id.toString();
          const feedTokenId = (BigInt(messageTokenId) + FEED_TOKEN_OFFSET).toString();

          return (
            <div key={messageTokenId} className="relative">
              <MessageCard message={message} />
              <div className="flex gap-3 text-xs font-mono">
                <a
                  href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${messageTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ansi-cyan)] hover:underline"
                >
                  [view message NFT]
                </a>
                <a
                  href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${feedTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ansi-yellow)] hover:underline"
                >
                  [view feed NFT]
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
