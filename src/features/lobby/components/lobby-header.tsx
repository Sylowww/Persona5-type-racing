import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { CopyCodeButton } from "./copy-code-button";

type LobbyHeaderProps = {
  dictionary: Dictionary["lobby"]["header"];
  code: string;
  server: { name: string; pingMs: number };
  readyCount: number;
  capacity: number;
};

export function LobbyHeader({ dictionary, code, server, readyCount, capacity }: LobbyHeaderProps) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-4 xl:flex-row xl:items-center">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative origin-left rotate-[-2deg] bg-primary-container px-6 py-2 text-on-primary-container shadow-hard-xl">
          <span className="absolute -top-3 -left-3 rotate-6 bg-secondary-container px-2 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed">
            {dictionary.tape}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-display text-headline-md uppercase italic leading-none tracking-wider text-secondary md:text-headline-lg">
              {dictionary.code} <span className="text-secondary-fixed">{code}</span>
            </h1>
            <CopyCodeButton code={code} label={dictionary.copy} copiedLabel={dictionary.copied} />
          </div>
        </div>

        <div className="flex rotate-1 items-center gap-2 bg-surface-container-high px-4 py-2 shadow-hard-md">
          <span className="size-2.5 rounded-full bg-secondary-fixed motion-safe:animate-ping" />
          <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
            {formatMessage(dictionary.server, { name: server.name, ping: server.pingMs })}
          </span>
        </div>
      </div>

      <div className="flex rotate-[-1deg] items-center gap-4 self-end bg-surface-container px-4 py-2 shadow-hard-md shadow-primary-container xl:self-auto">
        <div className="flex flex-col text-right">
          <span className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
            {dictionary.squad}
          </span>
          <span className="font-hud text-headline-sm font-black uppercase italic leading-none text-secondary">
            {formatMessage(dictionary.lockedIn, { ready: readyCount, total: capacity })}
          </span>
        </div>
        <div aria-hidden="true" className="flex items-center gap-1">
          {Array.from({ length: capacity }, (_, index) => (
            <span
              key={index}
              className={`h-7 w-3.5 -skew-x-12 ${index < readyCount ? "bg-secondary-fixed shadow-hard-xs" : "bg-surface-container-highest"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
