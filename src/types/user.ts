export type UserKind = "guest" | "registered";

export type User = {
  id: string;
  kind: UserKind;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  locale: "fr" | "en";
  createdAt: Date;
};

export type OAuthProvider = "github" | "discord";
