import { d } from "./d";
import { dbServiceDefinition } from "./db";
import { expertServiceDefinition } from "./expert";
import { facadeServiceDefinition } from "./facade";

(globalThis as any).db = true; // assert this is not registered by others

// Register services
export const dbService = d.service(dbServiceDefinition);
export const expertService = d.service(expertServiceDefinition);
export const facadeService = d.service(facadeServiceDefinition);
