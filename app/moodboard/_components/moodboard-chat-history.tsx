"use client";

export type HistoryMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export function MoodboardChatHistory({
  messages,
  thinking,
  generating,
  genStatus,
}: {
  messages: HistoryMessage[];
  thinking?: boolean;
  generating?: boolean;
  genStatus?: string;
}) {
  return (
    <div className="space-y-6 pb-4">
      {messages.map((msg) =>
        msg.role === "assistant" ? (
          <p
            key={msg.id}
            className="max-w-[95%] text-[15px] leading-relaxed text-white"
          >
            {msg.text}
          </p>
        ) : (
          <div key={msg.id} className="flex justify-end">
            <span className="max-w-[85%] rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[13px] leading-snug text-zinc-400">
              {msg.text}
            </span>
          </div>
        ),
      )}

      {thinking ? (
        <div className="flex items-center gap-1 py-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
        </div>
      ) : null}

      {generating ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
          </div>
          {genStatus ? (
            <p className="text-xs text-zinc-500">{genStatus}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
