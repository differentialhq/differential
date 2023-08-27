# Example Application: Greet

This is a simple hello world that demonstrates how to use Differential from within two independented isolated Node.js processes.

## Usage

### 1. Start the counter

```bash
npm run counter
```

### 2. "Greet" a few times 

```bash
for i in {1..10}; do
  npm run greeter &
done
```

### 3. Observe the counter

The counter should be incrementing as the greeters are running. You can start more counters and greeters to see how they interact.

## Other notes

- As long as the `apiKey`, `apiSecret`, and `environmentId` match, you can start counters and greeters from any computer / network-enabled device.
- Counter and greeter can be started in any order. Barring any timeouts, the greeter functions will wait for the counter to be ready before exiting.
- You can start as many counters as you want. Each will have it's own state and will not interfere with each other.
- Counter and greeter functions can be altered as if they were running in the same process. Differential takes care of the inter-process communication for you.