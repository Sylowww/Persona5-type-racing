import { Icon, type IconName } from "@/components/ui/icon";

type AuthFieldProps = {
  name: string;
  label: string;
  icon: IconName;
  type?: "text" | "email" | "password";
  autoComplete: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  maxLength?: number;
};

export function AuthField({ name, label, icon, type = "text", autoComplete, defaultValue, hint, error, maxLength }: AuthFieldProps) {
  const id = `auth-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 bg-surface-container-lowest px-3 shadow-inner transition-shadow focus-within:shadow-hard-sm ${
          error ? "shadow-hard-xs shadow-primary-container focus-within:shadow-primary-container" : "focus-within:shadow-secondary-fixed"
        }`}
      >
        <Icon name={icon} size={20} className={error ? "text-primary-container" : "text-on-surface-variant"} />
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          maxLength={maxLength}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="w-full min-w-0 bg-transparent py-3 font-body text-body-md font-bold text-secondary placeholder:text-surface-variant focus:outline-none"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1 font-hud text-label-hud font-black text-primary-container">
          <Icon name="warning" size={16} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="font-body text-[13px] text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
