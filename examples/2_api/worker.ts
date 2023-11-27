import { d } from "./utils/differential";

d.listen({
  asMachineType: "worker",
  registerPaths: ["./utils/email"],
});

console.log("Worker started");
