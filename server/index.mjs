import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiApp } from "./api.mjs";

const app = express();
const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distPath = resolve(projectRoot, "dist");
const indexPath = resolve(distPath, "index.html");

app.use(createApiApp());
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  return res.sendFile(indexPath);
});

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
app.listen(port, host, () => {
  console.log(`Skrivcoach server kör på http://${host}:${port}`);
});
