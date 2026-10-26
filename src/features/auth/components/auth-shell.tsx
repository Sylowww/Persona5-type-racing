import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { PageBackdrop } from "@/components/layout/page-backdrop";

type AuthShellProps = {
  tape: string;
  title: string;
  subtitle: string;
  note?: string;
  switchPrompt: string;
  switchLabel: string;
  switchHref: string;
  preview: string;
  children: ReactNode;
};

/** Number of preview characters shown as already typed. */
const TYPED = 14;

export function AuthShell({ tape, title, subtitle, note, switchPrompt, switchLabel, switchHref, preview, children }: AuthShellProps) {
  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />

        <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-4 py-10 md:px-10 lg:grid-cols-2 lg:py-16">
          <section className="mx-auto w-full max-w-[480px]">
            <div className="panel border-t-4 border-t-primary-container p-6 md:p-8">
              <span className="eyebrow">{tape}</span>
              <h1 className="mt-3 font-display text-headline-md uppercase italic tracking-wider text-secondary md:text-headline-lg">
                {title}
              </h1>
              <p className="mt-1 text-on-surface-variant">{subtitle}</p>
              {note && (
                <p className="mt-4 flex items-center gap-2 font-hud text-label-hud font-black uppercase tracking-wider text-secondary-fixed">
                  <Icon name="star" size={16} filled />
                  {note}
                </p>
              )}
              <div className="mt-8">{children}</div>
              <p className="mt-8 flex flex-wrap border-t border-surface-container-high pt-6 items-center gap-2 text-on-surface-variant">
                {switchPrompt}
                <Link
                  href={switchHref}
                  className="font-hud font-black uppercase tracking-wider text-secondary-fixed underline decoration-2 underline-offset-4 hover:text-secondary"
                >
                  {switchLabel}
                </Link>
              </p>
            </div>
          </section>

          <div aria-hidden="true" className="hidden flex-col gap-6 lg:flex">
            <Icon name="keyboard" size={64} className="text-primary-container" />
            <p className="font-body text-typing-stream leading-relaxed">
              <span className="text-secondary">{preview.slice(0, TYPED)}</span>
              <span className="border-l-2 border-secondary-fixed motion-safe:animate-pulse" />
              <span className="text-surface-variant">{preview.slice(TYPED)}</span>
            </p>
            <div className="h-1 w-2/3 -skew-x-12 bg-surface-container">
              <div className="h-full bg-primary-container" style={{ width: `${Math.round((TYPED / preview.length) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
