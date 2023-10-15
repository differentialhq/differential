// import so that functions are registered
import "./program";

import { d } from "./differential";

// listen to work coming in
d.listen({
  asMachineTypes: ["counter"],
});
