import { Icon } from "@/components/ui/icon";

export function AuthSubmit({ label, pendingLabel, pending }: { label: string; pendingLabel: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-2 flex w-full -skew-x-6 items-center justify-center gap-2 bg-primary-container px-6 py-3 font-hud text-headline-sm font-black uppercase italic text-on-primary-container shadow-hard-md shadow-secondary transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed disabled:cursor-wait disabled:opacity-70"
    >
      <span className="skew-x-6">{pending ? pendingLabel : label}</span>
      <Icon name="arrow_forward" size={24} className="skew-x-6 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
    </button>
  );
}
