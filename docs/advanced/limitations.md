---
order: 1000
---

# Limitations

## Identifying the function across hosts

Once you deploy another version of your app to production via a rolling deployment, for a short time, both versions of the codebase will be live.

Differential will make sure that callers and callees do not intermingle between the versions, by using a consistent hash to syntactically identify a function.

However, this means that your deployment process should give enough time for "old versions" of your applications to drain after cutting off traffic.

Not doing so will result in orphan invocations, since they will not have suitable hosts to execute on.

You can override this behaviour if you wish by supplying the name parameter to wrapped functions. Differential will ignore generating a hash and instead rely on name to identify a function, which will allow you to execute invocations from old callers in new versions of your app. In this case however, you should take extra care in making sure the change to your function contracts are forwards and backwards compatible.