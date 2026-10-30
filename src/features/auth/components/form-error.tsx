import { Icon } from "@/components/ui/icon";

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-2 border-l-4 border-primary-container bg-error-container px-3 py-2 font-hud text-label-hud font-black uppercase text-on-error-container"
    >
      <Icon name="warning" size={18} />
      {message}
    </p>
  );
}
