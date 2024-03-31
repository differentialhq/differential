# How to end-to-end encrypt function arguments and return values

You might wish to encrypt all function arguments and return values, so that the control plane cannot see them. This is possible with Differential, but it requires you to configure your own encryption keys.

These encryption keys are used to encrypt and decrypt the function arguments and return values. The control plane does not have access to these keys.

The Typescript example below shows how to configure your own encryption keys.

```typescript
const d = new Differential("API_SECRET", {
  encryptionKeys: [
    Buffer.from("abcdefghijklmnopqrstuvwxzy123456"), // 32 bytes
  ],
});
```

It accepts an array of encryption keys. This is useful if you want to rotate your encryption keys. Differential will try to decrypt the function arguments and return values with each encryption key until it finds one that works.

Since this essentially makes function arguments opaque to the control plane, it is important to note that Differential will not be able to provide any of its usual features for these encrypted function arguments, such as predictive retries or predictive alerting.

Caching is still supported, as it is based on the function arguments and return values as supplied by the client.
