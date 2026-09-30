import { Icon } from "@/components/ui/icon";

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex -rotate-1 items-center gap-2 bg-primary-container px-3 py-2 font-hud text-label-hud font-black uppercase text-on-primary-container shadow-hard-sm"
    >
      <Icon name="warning" size={18} />
      {message}
    </p>
  );
}
