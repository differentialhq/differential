import { d } from "./utils/differential";

// so that functions get registered
import "./utils/email";

d.listen({
  asMachineType: "worker",
});

console.log("Worker started");
