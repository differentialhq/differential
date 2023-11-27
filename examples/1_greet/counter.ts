import { d } from "./differential";

// listen to work coming in
d.listen({
  asMachineType: "counter",
  registerPaths: ["./program"],
});
