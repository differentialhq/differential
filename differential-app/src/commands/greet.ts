import { d } from "../d";
import type { helloService } from "../services/hello";

async function greet(name: string = "World") {
  const result = await d.call<typeof helloService, "hello">("hello", name);
  console.log(`Received response: ${result}`);
}

greet(process.argv[2]).then(() => {
  console.log("Done!");
});
