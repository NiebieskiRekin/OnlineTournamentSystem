// import {
//   pgSchema,
//   check,
//   integer,
//   varchar,
//   date,
//   serial,
//   uuid,
//   customType,
//   boolean,
//   time,
// } from "drizzle-orm/pg-core";
// import { relations, sql } from "drizzle-orm";
// import {
//   createSelectSchema,
//   createInsertSchema,
//   createUpdateSchema,
// } from "drizzle-zod";
// import { z } from "@hono/zod-openapi";

import { pgTable, text, timestamp, boolean, serial, integer, primaryKey, numeric } from "drizzle-orm/pg-core";

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

export const discipline = pgTable("discipline", {
	id: serial().primaryKey(),
	name: text("name").unique(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date()
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date()
	),
})

export const sponsor = pgTable("sponsor",{
	id: serial().primaryKey(),
	name: text("name").notNull().unique(),
	logo: text("logo")
})

export const tournament = pgTable("tournament", {
	id: serial().primaryKey(),
	name: text("name").notNull(),
	discipline: integer("discipline").notNull().references(() => discipline.id, {onDelete: "cascade"}),
	organizer: text("organizer").notNull().references(() => user.id, { onDelete: "cascade" }),
	time: timestamp("time"),
	latitude: numeric("latitude"),
	longitude: numeric("longitude"),
	placeid: text("placeid"),
	maxParticipants: integer("max_participants").notNull().default(10),
	applicationDeadline: timestamp("application_deadline"),
	createdAt: timestamp("created_at").notNull().$defaultFn(
		() => /* @__PURE__ */ new Date()
	),
	updatedAt: timestamp("updated_at").notNull().$defaultFn(
		() => /* @__PURE__ */ new Date()
	),
	// number of ranked players
});

export const participant = pgTable("participant", {
	match: integer("match").notNull().references(()=>match.id,{onDelete:"cascade"}),
	user: text("id").notNull().references(()=>user.id,{onDelete:"cascade"}),
	score: integer("score"),
	winner: boolean("winner")
}, (table) => [
	primaryKey({ columns: [table.match, table.user]})]);

export const match = pgTable("match", {
	id: serial().primaryKey(),
	tournament: integer("tournament").notNull().references(()=>tournament.id,{onDelete: "cascade"}),
});
