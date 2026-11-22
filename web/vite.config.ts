import { defineConfig } from "vite";
const port = process.env.TOWN_PORT || "4310";
export default defineConfig({
  root: "web",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "^/api/(fixtures/(fresh|busy|inferno)|cricket|photos(/[\\w-]+(/image)?)?|events|chat/surfaces(/(gmail|github)/(connect|watch|events))?|chat/login(/status)?|chat/photo-turns|chat/pair|chat/bots(/[\\w-]+/messages)?)(\\?|$)": {
        target: "http://127.0.0.1:" + port,
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyReq", (outgoing, incoming) => {
            if (incoming.headers.origin === "http://" + incoming.headers.host)
              outgoing.setHeader("origin", "http://127.0.0.1:" + port);
          });
        },
      },
    },
  },
});
