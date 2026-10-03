import type { CharacterId } from "./character";

export type UserKind = "guest" | "registered";

export type User = {
  id: string;
  kind: UserKind;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  locale: "fr" | "en";
  character: CharacterId;
  createdAt: Date;
};

export const oauthProviders = ["google", "github", "discord"] as const;
export type OAuthProvider = (typeof oauthProviders)[number];
