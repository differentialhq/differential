import { createServer } from "http";

export const server = (port: number) =>
  createServer((request, response) => {
    response.writeHead(204, "No Content");
    response.end();
  }).listen(port);
