"use client";

import { useEffect, useRef, useState } from "react";
import {
  mergeFields,
  sendChat,
  type ChatMessage,
} from "@/lib/chat";
import type { NdaFormData } from "@/lib/nda-types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you draft your Mutual NDA. Tell me about the two parties " +
    "and what the NDA is for, and I'll fill in the document on the right as we go.",
};

export default function ChatPanel({
  data,
  onChange,
}: {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view. (Optional call: jsdom has no scrollTo.)
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setError(null);
    setBusy(true);

    try {
      const { reply, fields } = await sendChat(history, data);
      setMessages([...history, { role: "assistant", content: reply }]);
      onChange(mergeFields(data, fields));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col rounded-xl border border-line bg-paper-deep/40">
      {/* Conversation */}
      <div
        ref={scrollRef}
        className="preview-scroll flex-1 space-y-4 overflow-y-auto p-5"
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}
        {busy ? (
          <Bubble role="assistant">
            <span className="inline-flex gap-1">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
          </Bubble>
        ) : null}
      </div>

      {error ? (
        <p className="mx-5 mb-2 rounded-md border border-oxblood/30 bg-oxblood/[0.06] px-3 py-2 font-body text-[13px] text-oxblood">
          {error}
        </p>
      ) : null}

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-oxblood focus:ring-2 focus:ring-oxblood/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 rounded-full bg-ink px-5 py-2.5 font-ui text-[13px] font-600 tracking-[0.04em] text-paper transition-colors hover:bg-oxblood disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 font-body text-[15px] leading-relaxed ${
          isUser
            ? "bg-ink text-paper"
            : "border border-line bg-paper text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft"
      style={{ animationDelay: delay }}
    />
  );
}
