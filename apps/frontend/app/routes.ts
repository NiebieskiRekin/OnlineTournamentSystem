import {
    type RouteConfig,
    index,
    // layout,
    // prefix,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    index("./routes/dashboard.tsx"),
    route("/login", "./routes/auth/login.tsx"),
    route("/sign-up", "./routes/auth/sign-up.tsx"),
    route("/reset-password", "./routes/auth/reset-password.tsx"),
    route("/tournament/create", "./routes/tournament/new-tournament.tsx"),
    route("/tournament/:id", "./routes/tournament/tournament-details.tsx"),
    route("/tournament/:id/edit", "./routes/tournament/edit-tournament.tsx")
  ] satisfies RouteConfig;
  