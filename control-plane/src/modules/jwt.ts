import jwt, { GetPublicKeyOrSecret } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

if (!process.env.JWKS_URL) {
  throw new Error("JWKS_URL must be set");
}

const client = jwksClient({
  jwksUri: process.env.JWKS_URL,
});

const getKey: GetPublicKeyOrSecret = (header, callback) => {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export const verifyManagementToken = async ({
  managementToken,
}: {
  managementToken: string;
}): Promise<{
  userId: string;
}> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      managementToken,
      getKey,
      {
        algorithms: ["RS256"],
        ignoreExpiration: Boolean(process.env.IGNORE_EXPIRATION),
      },
      function (err, decoded) {
        if (err) {
          return reject(new AuthenticationError(err.message));
        }

        if (!decoded) {
          return reject(new AuthenticationError("No decoded token"));
        }

        if (typeof decoded.sub !== "string") {
          return reject(new AuthenticationError("No sub in decoded token"));
        }

        return resolve({
          userId: decoded.sub,
        });
      }
    );
  });
};
