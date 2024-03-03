import * as management from "./management";

export const validateManagementRequest = async (request: {
  headers: {
    authorization: string;
  };
  params: {
    clusterId: string;
  };
}): Promise<boolean> => {
  return validateManagementAccess({
    authorization: request.headers.authorization,
    clusterId: request.params.clusterId,
  });
};

export const validateManagementAccess = async ({
  authorization,
  clusterId,
}: {
  authorization?: string;
  clusterId: string;
}): Promise<boolean> => {
  if (!authorization) {
    return false;
  }

  const managementToken = authorization.split(" ")[1];

  try {
    const clusterAccess = await management.hasAccessToCluster({
      managementToken,
      clusterId,
    });
    return clusterAccess;
  } catch {
    console.error("Error validating management token", managementToken);
    return false;
  }
};
