"use client";

import { useState, useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  usePublicClient,
  useReadContract,
} from "wagmi";
import { decodeEventLog } from "viem";
import { PUBLIC_TERMINAL_ABI, CONTRACT_ADDRESS, PRICE_WEI, STICKY_PRICE_WEI } from "~/lib/contractABI";
import { AsciiHeader, MessageInput, FeedView, MyArtifacts } from "./terminal";

// View tabs
enum View {
  Mint = "mint",
  Feed = "feed",
  MyMints = "my",
}

// Use Base Sepolia for testing, switch to 8453 for mainnet
const BASE_CHAIN_ID = 84532; // Base Sepolia

// Convert bytes3 color to hex string
function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

export default function App() {
  const { actions, context } = useMiniApp();
  const { address, isConnected, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const [currentView, setCurrentView] = useState<View>(View.Mint);
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintedText, setMintedText] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [mintTimestamp, setMintTimestamp] = useState<string | null>(null);
  const [userColor, setUserColor] = useState<string>("#00FF00");
  const [feedKey, setFeedKey] = useState(0);
  const [debugSuccess, setDebugSuccess] = useState(false);

  // Debug: Ctrl+Shift+D to simulate successful mint
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDebugSuccess(true);
        setMintedText("This is a test transmission from the debug mode!");
        setMintedTokenId("2"); // Use tokenId 2 to test tagging previous poster (#1)
        setMintTimestamp(new Date().toISOString().replace("T", " ").slice(0, 16).replace(/-/g, "."));
        console.log("Debug: Simulated successful mint");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: txReceipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Capture timestamp when mint succeeds
  useEffect(() => {
    if (isSuccess && !mintTimestamp) {
      setMintTimestamp(new Date().toISOString().replace("T", " ").slice(0, 16).replace(/-/g, "."));
    }
  }, [isSuccess, mintTimestamp]);

  // Get total message count for share image
  const { data: messageCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getMessageCount",
  });

  // Get user's color from contract
  const { data: colorData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getColorForFid",
    args: [BigInt(context?.user?.fid || 0)],
  });

  // Update user color when data is fetched
  useEffect(() => {
    if (colorData) {
      setUserColor(bytes3ToHex(colorData as `0x${string}`));
    }
  }, [colorData]);

  // Parse token ID from transaction receipt
  useEffect(() => {
    if (txReceipt && txReceipt.logs) {
      for (const log of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: PUBLIC_TERMINAL_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "MessageMinted" && decoded.args) {
            const args = decoded.args as unknown as { tokenId: bigint };
            if (args.tokenId !== undefined) {
              setMintedTokenId(args.tokenId.toString());
              break;
            }
          }
        } catch {
          // Not our event, continue
        }
      }
    }
  }, [txReceipt]);

  const username = context?.user?.username || "anon";
  const fid = context?.user?.fid || 0;
  const isOnCorrectChain = chainId === BASE_CHAIN_ID;

  const handleMint = async (text: string, isSticky: boolean = false) => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!fid) {
      setError("Farcaster account not found");
      return;
    }

    // Switch chain if needed
    if (!isOnCorrectChain) {
      try {
        await switchChainAsync({ chainId: BASE_CHAIN_ID });
      } catch {
        setError("Please switch to Base network");
        return;
      }
    }

    setIsMinting(true);
    setError(null);
    setTxHash(null);
    setMintedText(text);

    try {
      // Get signature from backend
      console.log("Requesting signature...");
      const signResponse = await fetch("/api/sign-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid,
          username,
          text,
          address,
        }),
      });

      const signData = await signResponse.json();

      if (!signResponse.ok) {
        throw new Error(signData.error || "Failed to get signature");
      }

      const { signature } = signData;
      console.log("Signature obtained");

      // Simulate transaction
      const functionName = isSticky ? "mintSticky" : "mint";
      const value = isSticky ? STICKY_PRICE_WEI : PRICE_WEI;
      console.log(`Simulating ${functionName} transaction...`);
      try {
        await publicClient?.simulateContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: PUBLIC_TERMINAL_ABI,
          functionName,
          args: [BigInt(fid), username, text, signature as `0x${string}`],
          account: address as `0x${string}`,
          value,
        });
      } catch (simError: unknown) {
        console.error("Simulation failed:", simError);
        if (simError instanceof Error) {
          if (simError.message.includes("InsufficientPayment")) {
            const requiredAmount = isSticky ? "0.005" : "0.0005";
            throw new Error(`Insufficient funds. You need ${requiredAmount} ETH to ${isSticky ? "mint sticky" : "mint"}.`);
          } else if (simError.message.includes("MessageTooLong")) {
            throw new Error("Message too long. Max 280 characters.");
          } else if (simError.message.includes("InvalidSignature")) {
            throw new Error("Signature verification failed. Please try again.");
          }
        }
        throw new Error("Transaction simulation failed. Please try again.");
      }

      // Submit transaction
      console.log(`Submitting ${functionName} transaction...`);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PUBLIC_TERMINAL_ABI,
        functionName,
        args: [BigInt(fid), username, text, signature as `0x${string}`],
        value,
        chainId: BASE_CHAIN_ID,
      });

      setTxHash(hash);
      console.log("Transaction submitted:", hash);
    } catch (err: unknown) {
      console.error("Mint error:", err);
      if (err instanceof Error) {
        if (err.message.includes("rejected")) {
          setError("Transaction rejected");
        } else {
          setError(err.message);
        }
      } else {
        setError("Transaction failed");
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleShare = async () => {
    // Build share URL - OG image fetches feed context from contract
    const tokenId = mintedTokenId || "1";
    // Use the higher of messageCount or tokenId (in case messageCount is stale after mint)
    const actualTotal = Math.max(Number(messageCount) || 0, Number(tokenId));

    const shareParams = new URLSearchParams();
    if (actualTotal) shareParams.set("total", actualTotal.toString());
    const shareUrl = `${window.location.origin}/share/${tokenId}?${shareParams.toString()}`;

    // Fetch previous posters to tag them
    let mentions = "";
    try {
      const targetId = BigInt(tokenId);
      const prevIds = [targetId - 1n, targetId - 2n, targetId - 3n].filter(id => id >= 1n);

      if (prevIds.length > 0 && publicClient) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = await (publicClient as any).multicall({
          contracts: prevIds.map(id => ({
            address: CONTRACT_ADDRESS,
            abi: PUBLIC_TERMINAL_ABI,
            functionName: "getMessage",
            args: [id],
          })),
          allowFailure: true,
        });

        type MulticallResult = { status: string; result?: { username: string } };
        const usernames = (results as MulticallResult[])
          .filter((r: MulticallResult) => r.status === "success" && r.result)
          .map((r: MulticallResult) => r.result!.username)
          .filter((u: string) => u && u !== username); // Don't tag self

        if (usernames.length > 0) {
          mentions = " cc " + usernames.map((u: string) => `@${u}`).join(" ");
        }
      }
    } catch (err) {
      console.error("Failed to fetch previous posters:", err);
    }

    // Craft an engaging cast message
    const messagePreview = mintedText ? `"${mintedText}"` : "";

    const totalTx = actualTotal ? ` (#${tokenId} of ${actualTotal})` : "";
    const castText = `${messagePreview}\n\nTransmission${totalTx} is now permanent on PUBLIC_TERMINAL${mentions}`;

    try {
      if (actions?.composeCast) {
        const result = await actions.composeCast({
          text: castText,
          embeds: [shareUrl],
        });
        console.log("Cast composed:", result);
      } else {
        // Fallback for non-Farcaster browsers
        const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
        window.open(warpcastUrl, "_blank");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="terminal-container flex flex-col min-h-screen">
      {/* Header */}
      <AsciiHeader />

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col pb-28">
        {currentView === View.Mint && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 space-y-6">
              {/* Success State */}
              {(isSuccess || debugSuccess) ? (
                <div>
                <div className="space-y-4 pt-24">
                  {/* Token ID and timestamp */}
                  <p className="font-mono text-base text-terminal-text">
                    #{mintedTokenId || "--"} [{mintTimestamp || "--"}]
                  </p>

                  {/* Message display - simple, no border */}
                  <div className="font-mono text-base leading-relaxed">
                    <span style={{ color: userColor }}>&lt;{username}&gt;</span>{" "}
                    <span className="text-terminal-text">
                      {mintedText || "Your message was minted!"}
                    </span>
                  </div>
                </div>
                  {/* Share preview image - fetches feed context from contract, with fallback data */}
                  <img
                    src={`/api/opengraph-image/mint?tokenId=${mintedTokenId || "1"}&total=${Math.max(Number(messageCount) || 0, Number(mintedTokenId) || 0)}&username=${encodeURIComponent(username)}&text=${encodeURIComponent(mintedText || "")}&color=${encodeURIComponent(userColor)}&timestamp=${encodeURIComponent(mintTimestamp || "")}`}
                    alt="Share preview"
                    className="mt-6 w-full border border-[var(--terminal-border)]"
                  />
                  {/* Share button - bordered style like Mint button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="mt-4 w-full px-4 py-2 border border-[var(--ansi-lime)] text-[var(--ansi-lime)] font-mono text-sm hover:bg-[var(--ansi-lime)] hover:text-black transition-colors"
                  >
                    share
                  </button>
                </div>
              ) : (
                <>
                  {/* Default Mint State */}
                  {/* Minting/Confirming State */}
                  {(isMinting || isConfirming) ? (
                    <div className="py-8">
                      <p className="text-terminal-text font-mono text-center">
                        <span className="terminal-loading">
                          {isMinting ? "Preparing transmission" : "Confirming"}
                        </span>
                      </p>
                      {txHash && (
                        <p className="text-terminal-system text-xs mt-2 font-mono text-center">
                          TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Brief instruction */}
                      <p className="text-terminal-system text-xs font-mono">
                      Mint a permanent text artifact to the global feed.
                      </p>

                      <p className="text-terminal-system text-xs font-mono">You receive two NFTs: your personal message artifact and a dynamic view of the 15 most recent transmissions.</p>

                      {/* Error State */}
                      {error && (
                        <div>
                          <p className="text-[var(--ansi-red)] font-mono text-xs">{error}</p>
                        </div>
                      )}

                      {/* Message Input - THE MAIN ACTION */}
                      <MessageInput
                        username={username}
                        onSubmit={handleMint}
                        disabled={!isConnected || isMinting || isConfirming}
                        isLoading={isMinting || isConfirming}
                      />

                      {/* Wallet Status */}
                      {!isConnected && (
                        <p className="text-[var(--ansi-yellow)] text-xs font-mono">
                          Connect your wallet to transmit
                        </p>
                      )}

                      {isConnected && !isOnCorrectChain && (
                        <p className="text-[var(--ansi-yellow)] text-xs font-mono">
                          Please switch to Base network
                        </p>
                      )}

                      {/* Recent Transmissions - shows the feed inline */}
                      <div className="pt-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-terminal-system text-xs font-mono uppercase tracking-wider">
                            Recent Transmissions
                          </p>
                        </div>
                        <FeedView key={feedKey} count={5} showRefresh={false} />
                      </div>

                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {currentView === View.Feed && (
          <div className="px-6">
            <FeedView count={15} />
          </div>
        )}

        {currentView === View.MyMints && (
          <div className="px-6">
            <MyArtifacts fid={fid} address={address} />
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 pt-4 pb-6 px-6 bg-[var(--terminal-bg)]">
        <div className="flex justify-start gap-8">
          <button
            onClick={() => {
              setCurrentView(View.Mint);
              // Reset states when going back to mint from another view
              if (currentView !== View.Mint && (isSuccess || debugSuccess)) {
                setTxHash(null);
                setMintedText(null);
                setMintedTokenId(null);
                setMintTimestamp(null);
                setDebugSuccess(false);
              }
            }}
            className={`nav-tab ${currentView === View.Mint ? "active" : ""}`}
          >
            Terminal
          </button>
          <button
            onClick={() => setCurrentView(View.Feed)}
            className={`nav-tab ${currentView === View.Feed ? "active" : ""}`}
          >
            Feed
          </button>
          <button
            onClick={() => setCurrentView(View.MyMints)}
            className={`nav-tab ${currentView === View.MyMints ? "active" : ""}`}
          >
            Artifacts
          </button>
        </div>
      </div>
    </div>
  );
}
