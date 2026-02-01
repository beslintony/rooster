// app.config.ts
import { defineConfig } from "vinxi";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
var app_config_default = defineConfig({
  server: {
    preset: "node-server"
  },
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public"
    },
    {
      name: "client",
      type: "spa",
      handler: "./app/client.tsx",
      build: {
        target: "browser"
      },
      plugins: () => [
        TanStackRouterVite({
          routesDirectory: "./app/routes",
          generatedRouteTree: "./app/routeTree.gen.ts"
        }),
        react()
      ]
    }
  ]
});
export {
  app_config_default as default
};
