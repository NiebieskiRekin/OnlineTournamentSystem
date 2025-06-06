import {
    type RouteConfig,
    index,
    // layout,
    // prefix,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    index("./routes/dashboard.tsx"),
    route("/login", "./routes/login.tsx"),
    route("/sign-up", "./routes/sign-up.tsx"),
    route("/reset-password", "./routes/reset-password.tsx")
  ] satisfies RouteConfig;
  