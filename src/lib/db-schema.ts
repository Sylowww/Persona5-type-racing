import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Locale } from "@/i18n/locales";
import type { AvatarType } from "@/lib/avatar";
import type { RaceResult } from "@/types/race";
import type { OAuthProvider, User } from "@/types/user";

/*
 * Drizzle models of the tables. They mirror db/migrations/, which stays the source of truth:
 * a schema change is a new SQL migration plus the matching edit here. CHECK constraints live only
 * in the migrations.
 */

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").$type<User["kind"]>().notNull(),
    username: text("username").notNull(),
    email: text("email"),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    locale: text("locale").$type<User["locale"]>().notNull().default("fr"),
    characterId: text("character_id").notNull().default("joker"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_registered_key")
      .on(sql`lower(${table.username})`)
      .where(sql`${table.kind} = 'registered'`),
    uniqueIndex("users_email_key")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.email} IS NOT NULL`),
  ],
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    provider: text("provider").$type<OAuthProvider>().notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("oauth_accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId), index("sessions_expires_at_idx").on(table.expiresAt)],
);

export const raceResults = pgTable(
  "race_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lobbyCode: text("lobby_code").notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    place: integer("place").notNull(),
    racerCount: integer("racer_count").notNull(),
    wpm: doublePrecision("wpm").notNull(),
    accuracy: doublePrecision("accuracy").notNull(),
    // Null when the player did not finish the text.
    finishMs: integer("finish_ms"),
    durationMs: integer("duration_ms").notNull(),
    keystrokes: integer("keystrokes").notNull(),
    mistakes: integer("mistakes").notNull(),
    // Full results as the player saw them (RES-05, HIST-02); null for races saved before migration 008.
    result: jsonb("result").$type<RaceResult>(),
    createdAt: createdAt(),
  },
  (table) => [
    unique().on(table.userId, table.lobbyCode, table.endedAt),
    index("race_results_user_ended_idx").on(table.userId, table.endedAt.desc()),
  ],
);

export const userAvatars = pgTable("user_avatars", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").$type<AvatarType>().notNull(),
  data: bytea("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const raceTexts = pgTable(
  "race_texts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    language: text("language").$type<Locale>().notNull(),
    body: text("body").notNull().unique(),
    hasNumbers: boolean("has_numbers").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("race_texts_language_idx").on(table.language, table.hasNumbers)],
);

/** Who is in which lobby right now (SALLE-06): the primary key keeps a person in one lobby at most. */
export const lobbyMembers = pgTable("lobby_members", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  lobbyCode: text("lobby_code").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});
