"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterAllOutPortrait } from "@/lib/characters";
import { revealedLength, SPELL_CUT_IN_TIMELINE } from "@/lib/cut-in";
import type { RaceBonusEvent } from "@/types/race";
import { spellStyle } from "../spell-style";

type SpellCutInProps = {
  dictionary: Dictionary["race"]["spells"];
  events: readonly RaceBonusEvent[];
  youId: string;
};

/**
 * Persona-style flash when a catch-up spell involves you, as its caster or its target: the caster's all-out portrait
 * and the skill's name, like a battle cut-in. One at a time, each shown once.
 */
export function SpellCutIn({ dictionary, events, youId }: SpellCutInProps) {
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());
  const next = events.find((event) => (event.receiverId === youId || event.targetId === youId) && !seen.has(event.id));
  if (!next) return null;
  return <SpellBand key={next.id} dictionary={dictionary} event={next} onDone={() => setSeen((current) => new Set(current).add(next.id))} />;
}

function SpellBand({ dictionary, event, onDone }: { dictionary: SpellCutInProps["dictionary"]; event: RaceBonusEvent; onDone: () => void }) {
  const name = dictionary.names[event.spell];
  const line = event.wildCard ? formatMessage(dictionary.wildCard, { spell: name }) : `${name}!`;
  const elapsed = useCutInClock(true, line, SPELL_CUT_IN_TIMELINE);
  const style = spellStyle[event.element];
  const isDone = elapsed !== null && elapsed >= SPELL_CUT_IN_TIMELINE.endsAt;
  useEffect(() => {
    if (isDone) onDone();
  }, [isDone, onDone]);

  if (elapsed === null || isDone) return null;

  return (
    <CutInBand
      className="top-[22vh]"
      speaker={`${event.receiver} // ${event.persona}`}
      line={line}
      shownLength={revealedLength(elapsed, line.length, SPELL_CUT_IN_TIMELINE)}
      leaving={elapsed >= SPELL_CUT_IN_TIMELINE.leavesAt}
      visual={
        <div className={`spell-burst relative size-[120px] -rotate-6 border-4 bg-surface-container-lowest p-1 shadow-hard-lg md:size-[180px] ${style.border}`}>
          <div className="relative size-full overflow-hidden [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
            <Image src={characterAllOutPortrait(event.receiverCharacter)} alt="" fill sizes="180px" className="object-cover" />
          </div>
          <span className={`absolute -right-4 -bottom-4 flex size-12 items-center justify-center rounded-full shadow-hard-sm ${style.bg}`}>
            <Icon name={style.icon} size={30} filled className="text-surface-container-lowest" />
          </span>
        </div>
      }
    />
  );
}
