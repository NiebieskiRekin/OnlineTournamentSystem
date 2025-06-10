import { gte, lte, sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, serial, integer, primaryKey, check, foreignKey, pgEnum } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const tournament = pgTable("tournament", {
	id: serial().primaryKey(),
	name: text("name").notNull(),
	discipline: text("discipline").notNull(),
	organizer: text("organizer").notNull().references(() => user.id, { onDelete: "cascade" }),
	time: timestamp("time", {mode: "string", withTimezone: true}),
	location: text("location"),
  participants: integer("participants").notNull().default(0),
	maxParticipants: integer("max_participants").notNull().default(10),
	applicationDeadline: timestamp("application_deadline", {mode: "string", withTimezone: true}),
  sponsorLogos: text("sponsor_logos"),
  groupsCreated: boolean("groups_created").notNull().default(false),
  },
  (table) => [
    check("participants_cannot_be_greater_than_max", lte(table.participants,table.maxParticipants)),
    check("cannot_host_in_the_past", gte(table.time,sql`CURRENT_TIMESTAMP`)),
    check("cannot_apply_in_the_past", gte(table.applicationDeadline,sql`CURRENT_TIMESTAMP`)),
    check("minimum_2_participants", sql`${table.maxParticipants} >= 2`),
]);

export const participant = pgTable("participant", {
  id: serial().primaryKey(),
	tournament: integer("tournament").notNull().references(()=>tournament.id,{onDelete:"cascade"}),
	user: text("user").notNull().references(()=>user.id,{onDelete:"cascade"}),
	score: integer("score"),
  licenseNumber: text("license_number").notNull(),
});

export const matchState = pgEnum("match_state", [
  'NO_PARTY' , 'PLAYED'
])

export const match = pgTable("match", {
	id: serial().primaryKey(),
	tournament: integer("tournament").notNull().references(()=>tournament.id,{onDelete: "cascade"}),
  level: integer("level").notNull().default(0),
  state: matchState("state").notNull().default("NO_PARTY"),
  nextMatch: integer("next_match")
}, (table)=>[
  foreignKey({
    columns: [table.nextMatch],
    foreignColumns: [table.id],
    name: "next_match_fk"
  })
]);

export const matchParticipantState = pgEnum("match_participant_state", [
  'WON', 'LOST','NOT_PLAYED'
]);


export const matchParticipant = pgTable("match_participant", {
  participant: integer("participant").notNull().references(()=>participant.id,{onDelete:"cascade"}),
  match: integer("match").notNull().references(()=>match.id,{onDelete:"cascade"}),
  score: integer("score"),
  state: matchParticipantState("state").notNull().default("NOT_PLAYED"),
}, (table) => [
  primaryKey({ columns: [table.participant, table.match]})]);

export const tournamentWinners = pgTable("tournament_winners", {
  participant: integer("participant").notNull().references(()=>participant.id,{onDelete:"cascade"}),
  tournament: integer("tournament").notNull().references(()=>tournament.id,{onDelete: "cascade"}),
}, (table) => [
  primaryKey({ columns: [table.participant, table.tournament]})]);