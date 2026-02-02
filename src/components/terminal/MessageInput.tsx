"use client";

import { useState, useRef, useEffect } from "react";
import { MAX_MESSAGE_LENGTH } from "~/lib/contractABI";

interface MessageInputProps {
  username: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function MessageInput({
  username,
  onSubmit,
  disabled = false,
  isLoading = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (text.trim() && !disabled && !isLoading) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const updateCursorPos = () => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart);
    }
  };

  const focusInput = () => {
    textareaRef.current?.focus();
  };

  // Update cursor position on various events
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelect = () => updateCursorPos();
    textarea.addEventListener("select", handleSelect);
    textarea.addEventListener("click", handleSelect);
    textarea.addEventListener("keyup", handleSelect);

    return () => {
      textarea.removeEventListener("select", handleSelect);
      textarea.removeEventListener("click", handleSelect);
      textarea.removeEventListener("keyup", handleSelect);
    };
  }, []);

  // Render text with cursor at correct position
  const renderTextWithCursor = () => {
    if (!text) {
      return isFocused ? (
        <span className="terminal-cursor" />
      ) : (
        <span className="text-terminal-text/50">Your message goes here</span>
      );
    }

    if (!isFocused) {
      return <span className="text-terminal-text">{text}</span>;
    }

    const beforeCursor = text.slice(0, cursorPos);
    const afterCursor = text.slice(cursorPos);

    return (
      <>
        <span className="text-terminal-text">{beforeCursor}</span>
        <span className="terminal-cursor" />
        <span className="text-terminal-text">{afterCursor}</span>
      </>
    );
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Message input box with border */}
      <div
        className="message-input-box relative"
        onClick={focusInput}
      >
        {/* Message preview with inline editing */}
        <div className="font-mono text-xs leading-relaxed pb-2 break-all">
          <span className="text-username-green">&lt;{username}&gt;</span>{" "}
          {renderTextWithCursor()}
        </div>

        {/* Mint button - always visible, activates when typing */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={disabled || isLoading || !hasText}
          className={`absolute bottom-2 right-4 px-2 py-1 border font-mono text-xs transition-colors ${
            hasText
              ? "border-[var(--ansi-lime)] text-[var(--ansi-lime)] hover:bg-[var(--ansi-lime)] hover:text-black"
              : "border-terminal-system/20 text-terminal-system/20 cursor-not-allowed"
          } ${(disabled || isLoading) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "minting..." : "mint"}
        </button>

        {/* Character count */}
        {hasText && (
          <span className="absolute bottom-2 left-4 text-terminal-system/70 text-xs font-mono">
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
      </div>

      {/* Sticky toggle - v2 feature */}

      {/* Hidden textarea for actual input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          updateCursorPos();
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSelect={updateCursorPos}
        disabled={disabled || isLoading}
        className="absolute opacity-0 pointer-events-none"
        maxLength={MAX_MESSAGE_LENGTH}
        autoFocus
      />
    </div>
  );
}
