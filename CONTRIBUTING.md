# Contributing to Differential

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Setting up the development environment

We use [tilt.dev](https://tilt.dev) to manage our development environment.

1. [Install](https://docs.tilt.dev/install.html) tilt on your machine.
2. Run `tilt up` in the root of the project.

## Running the admin console locally

The admin console is a Next.js app using Clerk.dev for authentication. To run it locally, you'll need to add a `.env.local` file to the `admin` directory with some test credentials from Clerk.dev. You can sign up for a free account at [clerk.dev](https://clerk.dev).

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
```

## We Develop with Github

We use github to host code, to track issues and feature requests, as well as accept pull requests.

## All Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the Apache-2.0 Software License

In short, when you submit code changes, your submissions are understood to be under the same license that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/differentialhq/differential/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/differentialhq/differential/issues/new).

## Write bug reports with detail, background, and sample code

A few things to consider when writing a bug report:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)
