import { d } from "./utils/differential";

// register functions
import "./utils/email";

d.listen({
  asPool: "worker",
});

console.log("Worker started");
