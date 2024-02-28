import { and, eq, isNotNull } from "drizzle-orm";
import * as data from "./data";

export type SemVerIncrement = "patch" | "minor" | "major";

import * as semver from "semver";

export const previousVersion = async ({
  clusterId,
}: {
  clusterId: string;
}): Promise<string> => {
  const previousVersions = await data.db
    .select({
      version: data.clientLibraryVersions.version,
    })
    .from(data.clientLibraryVersions)
    .where(
      and(
        eq(data.clientLibraryVersions.cluster_id, clusterId),
        isNotNull(data.clientLibraryVersions.asset_upload_id),
      ),
    );

  if (previousVersions.length === 0) {
    return "0.0.0";
  }

  return previousVersions.map((v) => v.version).sort(semver.rcompare)[0];
};

export const incrementVersion = ({
  version,
  increment,
}: {
  version: string;
  increment: SemVerIncrement;
}): string => {
  const nextVersion = semver.inc(version, increment);

  if (!nextVersion) {
    throw new Error(`Could not increment version: ${version} ${increment}`);
  }

  return nextVersion;
};
