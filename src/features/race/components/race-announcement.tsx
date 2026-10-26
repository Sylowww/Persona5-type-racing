import { RansomText } from "@/components/ui/ransom-text";

/**
 * A short banner in the powers slot above the track ("AMBUSH!", a calling card sent): a cut-out title and one line.
 * The line is announced to screen readers; the cut-out title is decorative.
 */
export function RaceAnnouncement({ title, line }: { title: string; line: string }) {
  return (
    <div className="ambush-banner absolute top-4 right-2 z-10 flex -rotate-2 items-center gap-3 bg-surface-container-lowest py-2 pr-4 pl-3 shadow-hard-md shadow-primary-container">
      <RansomText text={title} className="text-[30px] leading-none" />
      <p role="status" className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
        {line}
      </p>
    </div>
  );
}
