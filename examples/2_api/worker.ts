import { d } from "./utils/differential";

d.listen({
  asPool: "worker",
  registerPaths: ["./utils/email"],
});

console.log("Worker started");
