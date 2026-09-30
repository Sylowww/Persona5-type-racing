import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { OAuthProvider } from "@/types/user";

// Brand names are not translated.
const providerNames: Record<OAuthProvider, string> = { google: "Google", github: "GitHub", discord: "Discord" };

// Monochrome brand marks (24×24), coloured with the text colour.
const providerPaths: Record<OAuthProvider, string> = {
  google:
    "M12.24 10.29v3.64h5.07c-.22 1.3-1.56 3.8-5.07 3.8-3.05 0-5.54-2.53-5.54-5.64s2.49-5.64 5.54-5.64c1.74 0 2.9.74 3.57 1.38l2.43-2.35C16.68 3.99 14.66 3 12.24 3 7.25 3 3.2 7.03 3.2 12s4.05 9 9.04 9c5.22 0 8.68-3.67 8.68-8.83 0-.6-.07-1.05-.15-1.5z",
  github:
    "M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.71c-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.23C22 6.58 17.52 2 12 2z",
  discord:
    "M19.27 5.33A16.4 16.4 0 0 0 15.2 4l-.52 1.07a15.2 15.2 0 0 0-5.36 0L8.8 4a16.3 16.3 0 0 0-4.07 1.34C2.15 9.2 1.45 12.97 1.8 16.68a16.5 16.5 0 0 0 5 2.53l1.07-1.75c-.59-.22-1.15-.5-1.68-.82l.41-.32a11.7 11.7 0 0 0 10.8 0l.41.32c-.53.32-1.1.6-1.68.82l1.07 1.75a16.4 16.4 0 0 0 5-2.53c.41-4.3-.7-8.04-2.93-11.35zM8.68 14.4c-.98 0-1.79-.9-1.79-2.01s.79-2.02 1.79-2.02 1.8.91 1.79 2.02c0 1.1-.79 2.01-1.79 2.01zm6.64 0c-.98 0-1.79-.9-1.79-2.01s.79-2.02 1.79-2.02 1.8.91 1.79 2.02c0 1.1-.79 2.01-1.79 2.01z",
};

type OAuthButtonsProps = {
  locale: Locale;
  providers: readonly OAuthProvider[];
  dictionary: Dictionary["auth"]["oauth"];
};

/** Plain links: the flow starts in a Route Handler, so no client JavaScript is needed. */
export function OAuthButtons({ locale, providers, dictionary }: OAuthButtonsProps) {
  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <a
            key={provider}
            href={`/api/auth/${provider}?locale=${locale}`}
            className="flex items-center justify-center gap-3 bg-surface-container-lowest px-4 py-2.5 font-hud text-label-hud font-black uppercase tracking-widest text-secondary shadow-hard-sm transition-colors hover:bg-secondary hover:text-surface-container-lowest"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
              <path d={providerPaths[provider]} />
            </svg>
            {formatMessage(dictionary.continueWith, { provider: providerNames[provider] })}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-0.5 flex-1 -skew-x-12 bg-surface-container-highest" />
        <span className="font-hud text-label-hud font-black uppercase italic text-on-surface-variant">{dictionary.divider}</span>
        <span className="h-0.5 flex-1 -skew-x-12 bg-surface-container-highest" />
      </div>
    </div>
  );
}
