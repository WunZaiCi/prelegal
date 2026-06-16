"use client";

import { useEffect, useRef, useState } from "react";
import {
  emptyGenericData,
  getDocument,
  mergeGenericFields,
  type GenericDocData,
} from "@/lib/documents";
import {
  mergeFields,
  sendChat,
  type ChatMessage,
  type ChatResponse,
} from "@/lib/chat";
import type { NdaFormData } from "@/lib/nda-types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you draft a legal document. Tell me what you need — for " +
    "example an NDA, a cloud service agreement, or a partnership agreement — " +
    "and I'll figure out the right template and fill it in as we talk.",
};

export default function ChatPanel({
  docType,
  onDocTypeChange,
  ndaData,
  onNdaData,
  genericData,
  onGenericData,
}: {
  docType: string | null;
  onDocTypeChange: (docType: string) => void;
  ndaData: NdaFormData;
  onNdaData: (data: NdaFormData) => void;
  genericData: GenericDocData;
  onGenericData: (data: GenericDocData) => void;
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

  /** Apply the AI's docType selection and field updates to the lifted state. */
  const applyResult = (resp: ChatResponse) => {
    const switching = !!resp.docType && resp.docType !== docType;
    if (switching) onDocTypeChange(resp.docType as string);

    const targetDocType = resp.docType ?? docType;
    if (!targetDocType) return;
    const spec = getDocument(targetDocType);
    if (!spec) return;

    if (spec.kind === "nda") {
      if (resp.ndaFields) onNdaData(mergeFields(ndaData, resp.ndaFields));
    } else {
      const base = switching ? emptyGenericData(spec) : genericData;
      onGenericData(mergeGenericFields(spec, base, resp.fields));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setError(null);
    setBusy(true);

    // Send the current document's values for context (null while selecting).
    const context = docType
      ? getDocument(docType)?.kind === "nda"
        ? ndaData
        : genericData
      : null;

    try {
      const resp = await sendChat(history, docType, context);
      setMessages([...history, { role: "assistant", content: resp.reply }]);
      applyResult(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col rounded-xl border border-line bg-surface shadow-document">
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
        <p className="mx-5 mb-2 rounded-md border border-purple/30 bg-purple/[0.06] px-3 py-2 font-body text-[13px] text-purple">
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
          className="min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 rounded-full bg-purple px-5 py-2.5 font-ui text-[13px] font-600 tracking-[0.04em] text-white transition-colors hover:bg-purple-deep disabled:cursor-not-allowed disabled:opacity-50"
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
            ? "bg-blue text-white"
            : "border border-line bg-canvas text-ink"
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
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
      style={{ animationDelay: delay }}
    />
  );
}
