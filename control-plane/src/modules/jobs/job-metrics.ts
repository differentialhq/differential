import { Summary } from "prom-client";

export const jobDurations = new Summary({
  name: "differential_job_operations_duration_ms",
  help: "Duration of job operations in milliseconds",
  labelNames: ["operation"],
});
