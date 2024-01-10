require("dotenv").config();

import { initServer } from "@ts-rest/fastify";
import fastify from "fastify";
import process from "process";
import * as router from "./modules/router";
import cors from "@fastify/cors";

const app = fastify({
  // logger: true,
});

const s = initServer();

app.register(s.plugin(router.router), { jsonQuery: true});

app.register(cors, {
  origin: process.env.CONSOLE_ORIGIN || "https://console.differential.dev",
});

app.setErrorHandler((error, request, reply) => {
  console.error(error);

  return reply.status(500).send();
});

const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    console.log("Server listening on port 4000");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();
