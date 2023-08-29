# Example Application: Greet

This is a simple http server that demonstrates background jobs that execute in a separate process.

## Setup

### 1. Install dependencies

```bash
npm install
```

## Usage

### 1. Start the worker

```bash
npm run worker
```

### 2. Start the server

```bash
npm run server
```

### 3. Curl the server

```bash
curl http://localhost:3000/email?to=me@example.com
```

Your worker process will be sending the email in the background, while the server call returns immediately. This is done by wrapping the function with a `d.background`.

## Other notes

- You can start the server and the worker in any order. Worker will come online and start processing the backlog of jobs.
- To test out the SMTP server, you can run mailhog via `docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog`. Otherwise, background function will fail with `ECONNREFUSED`.