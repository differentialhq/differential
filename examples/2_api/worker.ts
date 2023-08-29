import * as differential from "./utils/differential";

// so that functions get registered
import "./utils/email";

differential.listen("worker");

console.log("Worker started");
