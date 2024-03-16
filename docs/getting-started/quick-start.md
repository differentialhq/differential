---
order: 2000
---

# Buiding your first service

Learn to build an end to end Differential app in under 2 minutes with TypeScript and Node.js.

## Running the hello world example

### 1. Set up and Install

Run the following command in your terminal to set up a hello world project

```bash
git clone git@github.com:differentialhq/app.git my-app && \
cd my-app && \
npm run setup && \
npm i -g tsx
```

This will:

- Clone the [Differential app template](https://github.com/differentialhq/app) into a dirctory called `my-app`
- Install the dependencies
- Fetch a temporary API secret for you to use and insert it to src/d.ts file
- Install the `tsx` CLI tool globally so you can run ts files directly

### 2. Start the hello service

```
tsx src/run/hello-service.ts
```

This will start a [service called `hello`](https://github.com/differentialhq/app/blob/master/src/services/hello.ts) and register itself with the Cloud control-plane.

### 3. Call the running service

```
tsx src/commands/greet.ts
```

This will call the [`greet` command](https://github.com/differentialhq/app/blob/master/src/commands/greet.ts) on the `hello` service and print the result.

## Extending the hello service

Let's add a new command to the hello service that will greet someone in a different language, so you can write some code.

### 1. Add a new function to the hello service

Open up the `src/services/hello.ts` file and add the following function, under the exising `hello` function:

```typescript
async function helloInAnotherLanguage(params: {
  from: string;
  language: string;
}) {
  console.log("Responding to hello request in", params.language);

  const languageDefinitions = await fetch(
    `https://raw.githubusercontent.com/differentialhq/app/master/fake-api/hello.json`,
  ).then((res) => res.json());

  const greeting = languageDefinitions[params.language];

  if (!greeting) {
    throw new Error(`Language ${params.language} not supported`);
  }

  return {
    message: `${greeting} ${params.from}! I'm a service running on pid ${process.pid}!`,
  };
}
```

As you can see, this function fetches a list of greetings from a fake API and returns the appropriate one. A Differential function can do anything a normal Node.js function can do, including making network requests.

### 2. Register the function with the service

```diff
 export const helloService = d.service({
   name: "hello",
   functions: {
     hello,
+    helloInAnotherLanguage,
   },
 });
```

### 3. Change the `greet` command to call the new function

You can replace the greet.ts file with the following. We're just extending the existing command to take a new `language` parameter and call the new function.

```typescript
// src/commands/greet.ts

import { d } from "../d";
import type { helloService } from "../services/hello";

const client = d.client<typeof helloService>("hello");

async function greet(name: string = "World", language: string = "english") {
  const result = await client.helloInAnotherLanguage({
    from: name,
    language,
  });

  console.log(`Received response: ${result.message}`);
}
```

### 4. Call the new command

```bash
tsx src/commands/greet.ts -- "Dali" "spanish"
# => Received response: Hola Dali! I'm a service running on pid 1234!

tsx src/commands/greet.ts -- "Mario" "italian"
# => Received response: Ciao Mario! I'm a service running on pid 1234!

# try other languages!
```
