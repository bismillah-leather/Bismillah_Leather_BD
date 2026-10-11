import "dotenv/config";
import { getPrisma } from "@bismillah/db";
import express from "express";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
});

const env = envSchema.parse(process.env);
const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const app = express();

app.disable("x-powered-by");
app.use(
  pinoHttp({
    logger: log,
    genReqId: (req, res) => {
      const header = req.headers["x-request-id"];
      const incoming = Array.isArray(header) ? header[0] : header;
      const id = incoming && incoming.length > 0 ? incoming : crypto.randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
  }),
);

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({
      type: "about:blank",
      title: "Service Unavailable",
      status: 503,
      code: "not_ready",
    });
  }
});

app.use((_req, res) => {
  res.status(404).type("application/problem+json").json({
    type: "about:blank",
    title: "Not Found",
    status: 404,
    code: "not_found",
  });
});

export default app;

// Local / Docker: listen on a port. On Vercel the platform invokes the export.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    log.info({ port: env.PORT }, "api listening");
  });
}
