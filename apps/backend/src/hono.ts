import { Hono } from "hono";
import { auth } from "./auth";

export type auth_vars = {
  Variables: {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
}};

export const hono = new Hono<auth_vars>();
