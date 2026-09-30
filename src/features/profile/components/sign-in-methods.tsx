import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { OAuthProvider } from "@/types/user";

// Brand names are not translated.
const providerNames: Record<OAuthProvider, string> = { google: "Google", github: "GitHub", discord: "Discord" };

type SignInMethodsProps = {
  dictionary: Dictionary["profile"]["accounts"];
  email: string | null;
  providers: readonly OAuthProvider[];
};

export function SignInMethods({ dictionary, email, providers }: SignInMethodsProps) {
  const methods = [
    ...(email ? [{ key: "password", name: dictionary.password, detail: email }] : []),
    ...providers.map((provider) => ({ key: provider, name: providerNames[provider], detail: dictionary.linked })),
  ];

  return (
    <section className="flex flex-col gap-3 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      <ul className="flex flex-col gap-2">
        {methods.map((method) => (
          <li key={method.key} className="flex flex-col gap-1 bg-surface-container-lowest px-3 py-2">
            <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{method.name}</span>
            <span className="flex min-w-0 items-center gap-1 text-[13px] text-on-surface-variant">
              <Icon name="check" size={16} className="text-secondary-fixed" />
              <span className="truncate">{method.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
