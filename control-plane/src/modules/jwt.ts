import jwt, { GetPublicKeyOrSecret } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

if (!process.env.JWKS_URL && !process.env.MANAGEMENT_SECRET) {
  throw new Error("No JWKS_URL or MANAGEMENT_SECRET in env. One is required.");
}

if (process.env.MANAGEMENT_SECRET) {
  const hasPrefix = process.env.MANAGEMENT_SECRET.startsWith("sk_management_");
  const hasLength = process.env.MANAGEMENT_SECRET.length > 64;

  if (!hasPrefix) {
    throw new Error("MANAGEMENT_SECRET must start with sk_management_");
  }

  if (!hasLength) {
    throw new Error("MANAGEMENT_SECRET must be longer than 64 characters");
  }
}

const client = process.env.JWKS_URL
  ? jwksClient({
      jwksUri: process.env.JWKS_URL,
    })
  : null;

const getKey: GetPublicKeyOrSecret = (header, callback) => {
  return client?.getSigningKey(header.kid, function (err, key) {
    var signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
};

export const CONTROL_PLANE_ADMINISTRATOR = "control-plane-administrator";

export const verifyManagementToken = async ({
  managementToken,
}: {
  managementToken: string;
}): Promise<{
  userId: string;
}> => {
  const managementSecretAuthEnabled = Boolean(process.env.MANAGEMENT_SECRET);

  if (managementSecretAuthEnabled && managementToken) {
    const secretsMatch = managementToken === process.env.MANAGEMENT_SECRET;

    if (secretsMatch) {
      return {
        userId: CONTROL_PLANE_ADMINISTRATOR,
      };
    } else {
      throw new AuthenticationError("Invalid token");
    }
  }

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
      },
    );
  });
};
