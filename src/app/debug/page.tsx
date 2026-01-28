"use client";

import { useState, useEffect } from "react";

export default function DebugPage() {
  const [username, setUsername] = useState("zeni.eth");
  const [text, setText] = useState("Everyone buy $shibacumrocketelon! To the moon 2026 Elon will tweet this confirmed 100%");
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [messageSvgUrl, setMessageSvgUrl] = useState("");
  const [feedSvgUrl, setFeedSvgUrl] = useState("/api/preview-nft?type=feed");
  const [activeTab, setActiveTab] = useState<"message" | "feed">("message");

  useEffect(() => {
    const params = new URLSearchParams({
      username,
      text,
      timestamp: String(timestamp),
    });
    setMessageSvgUrl(`/api/preview-nft?${params.toString()}`);
  }, [username, text, timestamp]);

  const handleSetCurrentTime = () => {
    setTimestamp(Math.floor(Date.now() / 1000));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8 text-green-400">NFT Preview Debug</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-700 pb-4">
        <button
          onClick={() => setActiveTab("message")}
          className={`px-4 py-2 rounded ${
            activeTab === "message"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Message NFT
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded ${
            activeTab === "feed"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Feed NFT
        </button>
      </div>

      {activeTab === "message" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                maxLength={64}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Message ({text.length}/280)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white h-32 resize-none"
                maxLength={280}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Timestamp (Unix)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={timestamp}
                  onChange={(e) => setTimestamp(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                />
                <button
                  onClick={handleSetCurrentTime}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                >
                  Now
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(timestamp * 1000).toUTCString()}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Direct SVG URL:</p>
              <code className="block bg-gray-900 p-3 rounded text-xs break-all text-green-300">
                {messageSvgUrl}
              </code>
            </div>

            <div className="pt-4">
              <a
                href={messageSvgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Open SVG in New Tab
              </a>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h2 className="text-lg text-gray-400">Message NFT Preview</h2>
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
              {messageSvgUrl && (
                <img
                  src={messageSvgUrl}
                  alt="Message NFT Preview"
                  className="w-full h-auto"
                  key={messageSvgUrl}
                />
              )}
            </div>
            <p className="text-xs text-gray-500">
              This preview matches what the on-chain message NFT will look like.
            </p>
          </div>
        </div>
      )}

      {activeTab === "feed" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              <h3 className="text-lg text-yellow-400 mb-3">Feed NFT Info</h3>
              <p className="text-sm text-gray-300 mb-4">
                The Feed NFT shows the 15 most recent transmissions. It updates dynamically
                as new messages are minted to the contract.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Shows timestamps, usernames (colored), and truncated messages</li>
                <li>• Each user gets a deterministic color based on their FID</li>
                <li>• Messages are truncated to 50 characters</li>
                <li>• Footer shows total transmission count</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Direct SVG URL:</p>
              <code className="block bg-gray-900 p-3 rounded text-xs break-all text-green-300">
                {feedSvgUrl}
              </code>
            </div>

            <div className="pt-4">
              <a
                href={feedSvgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Open SVG in New Tab
              </a>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h2 className="text-lg text-gray-400">Feed NFT Preview</h2>
            <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
              <img
                src={feedSvgUrl}
                alt="Feed NFT Preview"
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs text-gray-500">
              This preview uses mock data. The actual NFT will show real messages from the contract.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
