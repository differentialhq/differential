import process from "process";
import { readFileSync } from "fs";

const file = process.argv[2];

// 732247b, 2023-12-17, feat: Updating the docs to 3.0
// 56c69ce, 2023-12-16, docs: Update docs to reflect 3.0
// f9b81aa, 2023-12-12, docs: Updating the docs to new package name

const commits = readFileSync(file, "utf8").split("\n");

type Changeset = {
  hash: string;
  date: string;
  message: string;
};

const changeset = commits.map((commit: string) => {
  const [hash, date, ...message]: string[] = commit.split(", ");

  return {
    hash,
    date,
    message: message.join(", "),
  } as Changeset;
});

type GroupedChangeset = {
  [date: string]: {
    features: {
      description: string;
      hash: string;
    }[];
    chores: {
      description: string;
      hash: string;
    }[];
    fixes: {
      description: string;
      hash: string;
    }[];
    documentation: {
      description: string;
      hash: string;
    }[];
    releases: {
      description: string;
      hash: string;
    }[];
    breaking: {
      description: string;
      hash: string;
    }[];
  };
};

const grouped = changeset.reduce((acc: GroupedChangeset, curr: Changeset) => {
  const { date, message, hash } = curr;
  const [type, description] = message.split(":");

  if (!acc[date]) {
    acc[date] = {
      features: [],
      chores: [],
      fixes: [],
      documentation: [],
      releases: [],
      breaking: [],
    };
  }

  switch (type) {
    case "feat":
      acc[date].features.push({
        description: description.trim(),
        hash,
      });
      break;
    case "chore":
      acc[date].chores.push({
        description: description.trim(),
        hash,
      });
      break;
    case "fix":
      acc[date].fixes.push({
        description: description.trim(),
        hash,
      });
      break;
    case "docs":
      acc[date].documentation.push({
        description: description.trim(),
        hash,
      });
      break;
    case "release":
      acc[date].releases.push({
        description: description.trim(),
        hash,
      });
      break;
    default:
      break;
  }

  return acc;
}, {});

console.log("# Changelog");

for (const [date, changes] of Object.entries(grouped)) {
  const hasAnyChanges =
    changes.features.length > 0 ||
    changes.chores.length > 0 ||
    changes.fixes.length > 0 ||
    changes.documentation.length > 0;

  if (!hasAnyChanges) {
    continue;
  }

  console.log(`## ${date}`);

  if (changes.releases.length > 0) {
    console.log("- Releases");
    changes.releases.forEach((release) =>
      console.log(
        `  - ${release.description} [${release.hash}](https://github.com/differentialhq/differential/commit/${release.hash})`
      )
    );
  }

  if (changes.features.length > 0) {
    console.log("- Features");
    changes.features.forEach((release) =>
      console.log(
        `  - ${release.description} [${release.hash}](https://github.com/differentialhq/differential/commit/${release.hash})`
      )
    );
  }

  if (changes.fixes.length > 0) {
    console.log("- Fixes");
    changes.fixes.forEach((release) =>
      console.log(
        `  - ${release.description} [${release.hash}](https://github.com/differentialhq/differential/commit/${release.hash})`
      )
    );
  }

  if (changes.chores.length > 0) {
    console.log("- Chores");
    changes.chores.forEach((release) =>
      console.log(
        `  - ${release.description} [${release.hash}](https://github.com/differentialhq/differential/commit/${release.hash})`
      )
    );
  }

  if (changes.documentation.length > 0) {
    console.log("- Documentation");
    changes.documentation.forEach((release) =>
      console.log(
        `  - ${release.description} [${release.hash}](https://github.com/differentialhq/differential/commit/${release.hash})`
      )
    );
  }
}
