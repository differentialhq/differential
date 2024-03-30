---
order: 1990
---

# Writing your first app with Differential

In this guide, we'll walk you through creating a simple service with Differential. We will:

1. Create your first Differential cluster
2. Create a simple service that returns a greeting
3. Call the service from a client
4. See the cluster activity from the Differential Dashboard

## 1. Install the Differential CLI

To get started with Differential, you'll need to install the Differential CLI. You can do this by running the following command:

```sh
npm install -g @differentialhq/cli # this will install the Differential CLI globally
```

## 2. Authenticate with Differential

To authenticate with Differential, run the following command:

```sh
differential auth login
```

## 3. Create a directory for your service

```sh
mkdir my-app
cd my-app
```

## 4. Initialize your project

The following command will create a new project in the current directory. And install the necessary dependencies.

```sh
npm init -y
npm install @differentialhq/core typescript tsx
```

## 5. Create a Differential cluster

```sh
differential clusters create
```

This will give you a API Secret. Copy this to the clipboard so we can use it in the next step.

## 6. Initialize your Differential client.

Create a new file called `src/d.ts` and add the following code:

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
