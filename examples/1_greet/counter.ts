import { d } from "./differential";

// import the program so it can be registered
import "./program";

// listen to work coming in
d.listen({
  asPool: "counter",
});
