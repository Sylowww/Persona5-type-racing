import { Icon } from "@/components/ui/icon";

export function AuthSubmit({ label, pendingLabel, pending }: { label: string; pendingLabel: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group btn-primary mt-2 w-full py-3.5 disabled:cursor-wait"
    >
      <span>{pending ? pendingLabel : label}</span>
      <Icon name="arrow_forward" size={20} className="motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
    </button>
  );
}
