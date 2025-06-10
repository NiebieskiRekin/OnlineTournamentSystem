import {
    type RouteConfig,
    index,
    layout,
    prefix,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    layout("./components/App.tsx", [
      index("./routes/dashboard.tsx"),
      ...prefix("tournament", [
        route("create", "./routes/tournament/new-tournament.tsx"),
        route(":id", "./routes/tournament/tournament-details.tsx"),
        route(":id/edit", "./routes/tournament/edit-tournament.tsx")
      ]),
      ...prefix("matches", [
        index("./routes/games.tsx"),
      ]),
      route("brackets", "./routes/tournament/brackets.tsx")
    ]),
    route("/login", "./routes/auth/login.tsx"),
    route("/sign-up", "./routes/auth/sign-up.tsx"),
    route("/reset-password", "./routes/auth/reset-password.tsx"),
  ] satisfies RouteConfig;
  