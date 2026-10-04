"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat";
import type { LobbyMessage } from "@/types/lobby";

type TauntFeedProps = {
  dictionary: Dictionary["lobby"]["chat"];
  messages: readonly LobbyMessage[];
  youId: string;
  /** Sends a message; resolves to an error code, or null once the server accepted it. */
  onSend: (text: string) => Promise<string | null>;
};

export function TauntFeed({ dictionary, messages, youId, onSend }: TauntFeedProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the newest message in view.
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastId]);

  function send(text: string, clearDraft: boolean) {
    if (text.trim().length === 0) return;
    startTransition(async () => {
      const result = await onSend(text);
      setError(result === "tooFast" ? dictionary.tooFast : null);
      if (result === null && clearDraft) setDraft("");
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft, true);
  }

  return (
    <section className="flex flex-col gap-3 bg-surface-container p-4 shadow-hard-xl shadow-primary-container">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 truncate font-hud text-[18px] font-black uppercase italic tracking-wider text-secondary">
          <Icon name="chat" size={20} className="text-primary-container" />
          {dictionary.title}
        </h2>
        <span className="flex items-center gap-1.5 font-hud text-label-hud font-black uppercase text-secondary-fixed">
          <span aria-hidden="true" className="size-2 rounded-full bg-secondary-fixed motion-safe:animate-pulse" />
          {dictionary.live}
        </span>
      </div>

      <ul
        ref={listRef}
        aria-live="polite"
        className="flex h-64 flex-col gap-1.5 overflow-y-auto bg-surface-container-lowest p-3 text-[14px]"
      >
        {messages.length === 0 && <li className="italic text-outline">{dictionary.empty}</li>}
        {messages.map((message) => (
          <li key={message.id} className="break-words">
            <span className={`font-bold ${message.authorId === youId ? "text-secondary-fixed" : "text-primary"}`}>{message.author}:</span>{" "}
            {message.text}
          </li>
        ))}
      </ul>

      <div role="group" aria-label={dictionary.quickLabel} className="flex flex-wrap gap-1">
        {dictionary.taunts.map((taunt) => (
          <button
            key={taunt}
            type="button"
            disabled={isPending}
            onClick={() => send(taunt, false)}
            className="-skew-x-6 bg-surface-container px-2 py-0.5 font-hud text-[11px] font-black uppercase text-secondary transition-transform enabled:hover:-translate-y-0.5 enabled:hover:bg-primary-container"
          >
            {taunt}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-1">
        <input
          id="lobby-chat-input"
          aria-label={dictionary.inputLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={dictionary.placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-surface-container-lowest px-2 py-1 text-[13px] text-on-surface outline-none placeholder:text-outline focus:outline-2 focus:outline-secondary-fixed"
        />
        <button
          type="submit"
          disabled={isPending || draft.trim().length === 0}
          aria-label={dictionary.send}
          className="flex items-center bg-primary-container px-2 text-on-primary-container disabled:opacity-50"
        >
          <Icon name="send" size={18} />
        </button>
      </form>
      {error && (
        <p role="alert" className="text-[12px] text-error">
          {error}
        </p>
      )}
    </section>
  );
}
