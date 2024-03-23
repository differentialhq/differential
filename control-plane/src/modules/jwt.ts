import jwt, { GetPublicKeyOrSecret } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { env } from "../utilities/env";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

const client = env.JWKS_URL
  ? jwksClient({
      jwksUri: env.JWKS_URL,
    })
  : null;

const getKey: GetPublicKeyOrSecret = (header, callback) => {
  if (!client) {
    return callback(
      new Error(
        "JWKS client not initialized. Probably missing JWKS_URL in env.",
      ),
    );
  }

  return client.getSigningKey(header.kid, function (err, key) {
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
  const managementSecretAuthEnabled = Boolean(env.MANAGEMENT_SECRET);

  if (managementSecretAuthEnabled && managementToken) {
    const secretsMatch = managementToken === env.MANAGEMENT_SECRET;

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
        ignoreExpiration: env.JWT_IGNORE_EXPIRATION,
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
