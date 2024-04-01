---
order: 1990
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
// src/d.ts

import { Differential } from "@differentialhq/core";

export const d = new Differential("YOUR_API_SECRET");
```

Make sure to replace YOUR_API_SECRET with the API Secret you copied in the previous step.

## 7. Create your first service

Now we'll create a simple hello world service in the `src/service.ts` file.

```typescript
// src/service.ts

import { d } from "./d";

async function hello(from: { name: string }) {
  return `Hello, ${from.name}!`;
}

export const helloService = d.service({
  name: "hello",
  functions: {
    hello,
  },
});

helloService.start().then(() => {
  console.log("Service started");
});
```

You can now run your service with the following command:

```sh
tsx src/service.ts
```

## 8. Call your service

Now that your service is running, you can call it from anywhere, as long as it can connect with the correct Differential cluster.

Let's create a simple script that calls the `hello` function on the `hello` service.

Create a new file called `src/call-hello.ts` and add the following code:

```typescript
// src/call-hello.ts

import { d } from "./d";
import type { helloService } from "./service";

const client = d.client<typeof helloService>("hello");

(async function main() {
  const result = await client.hello({
    name: "World",
  });

  console.log(result);
})();
```

You can run this script with the following command:

```sh
tsx src/call-hello.ts
# => Hello, World!
```

## 9. Check out the cluter activity

You've just created your first Differential service! To see the internal of your cluster, you can run the following command:

```sh
differential clusters open
```

You can now build more complex services by adding more functions to your service and calling them from your client.
