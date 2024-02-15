import * as management from "./management";

export const validateManagementAccess = async (request: {
  headers: {
    authorization: string;
  };
  params: {
    clusterId: string;
  };
}): Promise<boolean> => {
  const managementToken = request.headers.authorization.split(" ")[1];

  try {
    const clusterAccess = await management.hasAccessToCluster({
      managementToken,
      clusterId: request.params.clusterId,
    });
    return clusterAccess;
  } catch {
    console.error("Error validating management token", managementToken);
    return false;
  }
};
