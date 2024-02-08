import "./utilities/env";
import "./utilities/profiling";

import cors from "@fastify/cors";
import { initServer } from "@ts-rest/fastify";
import fastify from "fastify";
import process from "process";
import * as jobs from "./modules/jobs/jobs";
import * as events from "./modules/observability/events";
import * as router from "./modules/router";

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

const start = async () => {
  await jobs.start();
  await events.initialize();

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
