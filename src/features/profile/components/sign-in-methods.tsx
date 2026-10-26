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
    <section className="panel flex flex-col gap-4 p-6">
      <h2 className="eyebrow text-secondary">{dictionary.title}</h2>
      <ul className="flex flex-col divide-y divide-surface-container-high">
        {methods.map((method) => (
          <li key={method.key} className="flex flex-col gap-1 py-3">
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
