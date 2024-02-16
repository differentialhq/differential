import "./utilities/env";
import "./utilities/profiling";

import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import fastify from "fastify";
import process from "process";
import * as deploymentScheduler from "./modules/deployment/scheduler";
import * as jobs from "./modules/jobs/jobs";
import * as events from "./modules/observability/events";
import * as router from "./modules/router";

import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 50, // 10 points
  duration: 1, // Per second
});

const app = fastify({
  logger: process.env.ENABLE_FASTIFY_LOGGER === "true",
});

const s = initServer();

app.register(s.plugin(router.router));

app.register(cors, {
  origin: process.env.CONSOLE_ORIGIN || "https://console.differential.dev",
});

app.setErrorHandler((error, request, reply) => {
  console.error(error);

  return reply.status(500).send();
});

app.addHook("onRequest", async (request, reply) => {
  try {
    await rateLimiter.consume(request.ip, 1);
  } catch (rejRes) {
    const rateLimiterRes: {
      msBeforeNext: number;
    } = rejRes as any;

    const headers = {
      "Retry-After": rateLimiterRes.msBeforeNext,
    };

    return reply
      .headers(headers)
      .code(429)
      .send({ error: "Too Many Requests" });
  }
});

const start = async () => {
  await jobs.start();
  await events.initialize();
  await deploymentScheduler.start();

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    console.log("Server listening on port 4000");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();

process.on("beforeExit", async () => {
  await events.quit();
});
