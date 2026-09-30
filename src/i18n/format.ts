export type MessageValues = Record<string, string | number>;

/** Replaces `{name}` placeholders with the matching value; unknown placeholders are kept as-is. */
export function formatMessage(template: string, values: MessageValues): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}
