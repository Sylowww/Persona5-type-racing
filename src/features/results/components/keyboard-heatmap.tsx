import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { keyHeat, type KeyHeat } from "@/lib/results";
import type { KeyStat } from "@/types/race";
import { SectionTag } from "./section-tag";

type KeyboardHeatmapProps = {
  dictionary: Dictionary["results"]["heatmap"];
  keyStats: readonly KeyStat[];
};

const rows = ["1234567890", "qwertyuiop", "asdfghjkl;", "zxcvbnm,."] as const;

const heatClass: Record<KeyHeat, string> = {
  fast: "bg-secondary text-surface-container-lowest",
  steady: "bg-secondary-fixed text-on-secondary-fixed",
  slow: "bg-primary-container text-on-primary-container ring-2 ring-primary-fixed",
  unused: "bg-surface-container-high text-outline",
};

const legend: readonly Exclude<KeyHeat, "unused">[] = ["fast", "steady", "slow"];

export function KeyboardHeatmap({ dictionary, keyStats }: KeyboardHeatmapProps) {
  const stats = new Map(keyStats.map((stat) => [stat.key.toLowerCase(), stat]));
  const heatOf = (key: string) => keyHeat(stats.get(key));
  const label = (key: string, name: string) => formatMessage(dictionary.key, { key: name, heat: dictionary[heatOf(key)] });

  return (
    <section aria-labelledby="results-heatmap" className="flex flex-col gap-4">
      <SectionTag id="results-heatmap" icon="keyboard" title={dictionary.title} badge={dictionary.layout} />

      <div className="bg-surface-container p-4 shadow-hard-lg">
        <ul aria-label={dictionary.legend} className="mb-3 flex flex-wrap justify-end gap-3 font-hud text-label-hud font-black uppercase text-on-surface-variant">
          {legend.map((heat) => (
            <li key={heat} className="flex items-center gap-1">
              <span aria-hidden="true" className={`size-2.5 ${heatClass[heat]}`} />
              {dictionary[heat]}
            </li>
          ))}
        </ul>

        <div role="list" className="space-y-1.5 bg-surface-container-lowest p-3 font-hud text-xs font-black uppercase">
          {rows.map((row, index) => (
            <div key={row} className="flex justify-center gap-1" style={{ paddingLeft: `${index * 0.5}rem` }}>
              {[...row].map((key) => (
                <span
                  key={key}
                  role="listitem"
                  aria-label={label(key, key.toUpperCase())}
                  className={`flex size-6 items-center justify-center ${heatClass[heatOf(key)]}`}
                >
                  {key}
                </span>
              ))}
            </div>
          ))}
          <div className="flex justify-center">
            <span
              role="listitem"
              aria-label={label(" ", dictionary.space)}
              className={`flex h-6 w-40 items-center justify-center tracking-widest ${heatClass[heatOf(" ")]}`}
            >
              {dictionary.space}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
