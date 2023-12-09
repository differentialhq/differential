import { d } from "./differential";

// listen to work coming in
d.listen({
  asPool: "counter",
  registerPaths: ["./program"],
});
