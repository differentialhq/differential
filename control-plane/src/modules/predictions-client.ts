import { predictionsService } from "../types/predictions-service";
import { d } from "./d";

export const predictionsClient =
  d.client<typeof predictionsService>("predictions");
