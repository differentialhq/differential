---
order: 1300
---

# Getting Started

Learn to build an end to end Differential app in under 2 minutes with TypeScript and Node.js.

## 1. Set up and Install

Run the following command in your terminal to set up a hello world project

```bash
git clone git@github.com:differentialhq/app.git my-app && \ 
cd my-app && \ 
npm run setup
```

This will:
  - Clone the [Differential app template](https://github.com/differentialhq/app) into a dirctory called `my-app`
  - Install the dependencies
  - Fetch a temporary API secret for you to use and insert it to src/d.ts file

## 2. Start the hello service

```
npm run service --name=hello
```

This will start a [service called `hello`](https://github.com/differentialhq/app/blob/master/src/services/hello.ts) and register itself with the Cloud control-plane.

## 3. Call the running service

```
npm run command --name=greet
```

This will call the [`greet` command](https://github.com/differentialhq/app/blob/master/src/commands/greet.ts) on the `hello` service and print the result.

# Extending the hello service

Let's add a new command to the hello service that will greet someone in a different language, so you can write some code.

## 1. Add a new function to the hello service

Open up the `src/services/hello.ts` file and add the following function, under the exising `hello` function:

```typescript
async function helloInAnotherLanguage(params: {
  from: string;
  language: string;
}) {
  console.log("Responding to hello request in", params.language);

  const languageDefinitions = await fetch(
    `https://raw.githubusercontent.com/differentialhq/app/master/fake-api/hello.json`
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

## 2. Register the function with the service

```diff
 export const helloService = d.service({
   name: "hello",
   functions: {
     hello,
+    helloInAnotherLanguage,
   },
 });
```

## 3. Change the `greet` command to call the new function

You can replace the greet.ts file with the following. We're just extending the existing command to take a new `language` parameter and call the new function.

```typescript
// src/commands/greet.ts

import { d } from "../d";
import type { helloService } from "../services/hello";
import { starting } from "../utls/cmd";

async function greet(name: string = "World", language: string = "english") {
  const result = await d.call<typeof helloService, "helloInAnotherLanguage">(
    "helloInAnotherLanguage",
    { from: name, language }
  );

  console.log(`Received response: ${result.message}`);
}

if (starting()) {
  greet(process.argv[3], process.argv[4]).then(() => {
    console.log("Done!");
  });
}
```

## 4. Call the new command

```bash
npm run command --name=greet -- "Dali" "spanish"
npm run command --name=greet -- "Mario" "italian"
# try other languages!
```