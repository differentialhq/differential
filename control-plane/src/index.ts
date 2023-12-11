require("dotenv").config();

import { initServer } from "@ts-rest/fastify";
import fastify from "fastify";
import process from "process";
import * as router from "./modules/router";

const app = fastify({
  // logger: true,
});

const s = initServer();

app.register(s.plugin(router.router));

app.setErrorHandler((error, request, reply) => {
  console.error(error);

  return reply.status(500).send();
});

const start = async () => {
  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
