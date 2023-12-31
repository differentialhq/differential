import { d } from "../d";
import type { executorService } from "../services/executor";
import { t } from "../t";
import { parallel } from "./parallel";

export const executorClient = d.client<typeof executorService>("executor");

t(() => parallel(100));
