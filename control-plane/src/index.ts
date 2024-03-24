import { env } from "./utilities/env";
import "./utilities/profiling";

import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import fastify from "fastify";
import process from "process";
import { Counter, Summary, collectDefaultMetrics, register } from "prom-client";
import * as deploymentScheduler from "./modules/deployment/scheduler";
import * as jobs from "./modules/jobs/jobs";
import * as events from "./modules/observability/events";
import * as router from "./modules/router";
import { logContext, logger } from "./utilities/logger";

export const httpDurations = new Summary({
  name: "differential_http_operations_duration_ms",
  help: "Duration of http operations in milliseconds",
  labelNames: ["method", "route", "status"],
});

export const timeoutErrors = new Counter({
  name: "differential_timeout_errors",
  help: "Number of timeout errors",
  labelNames: ["method", "route"],
});

const app = fastify({
  logger: env.ENABLE_FASTIFY_LOGGER,
});

const metrics = fastify();
metrics.get("/metrics", (_request, reply) => {
  return register.metrics();
});

const s = initServer();

app.register(s.plugin(router.router));

app.register(cors, {
  origin: env.CONSOLE_ORIGIN,
});

app.setErrorHandler((error, request, reply) => {
  logger.error("Error in request", {
    path: request.routerPath,
    error,
  });

  return reply.status(500).send();
});

app.addHook("onRequest", (request, _reply, done) => {
  const context = {
    request: {
      id: request.id,
      path: request.routerPath,
      method: request.method,
    },
  };

  logContext.run(context, done);
});

app.addHook("onResponse", (request, reply, done) => {
  const route = request.routerPath;

  httpDurations
    .labels(request.method, route, reply.statusCode.toString())
    .observe(reply.getResponseTime());

  done();
});

app.addHook("onTimeout", (request, reply, done) => {
  const route = request.routerPath;

  timeoutErrors.labels(request.method, route).inc();
  done();
});

const start = async () => {
  await jobs.start();
  await events.initialize();
  await deploymentScheduler.start();

  collectDefaultMetrics({
    prefix: "differential_",
  });

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    logger.info("Server started", { port: 4000 });

    await metrics.listen({ port: 9091, host: "0.0.0.0" });
    logger.info("Metrics server started", { port: 9091 });
  } catch (err) {
    logger.error("Failed to start server", { error: err });
    process.exit(1);
  }
};

start();

process.on("beforeExit", async () => {
  await events.quit();
});
