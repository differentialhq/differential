import * as management from "./management";

export const validateManagementAccess = async (request: {
  headers: {
    authorization: string;
  };
  params: {
    clusterId: string;
  };
}) => {
  const managementToken = request.headers.authorization.split(" ")[1];

  const hasAccess = await management.hasAccessToCluster({
    managementToken,
    clusterId: request.params.clusterId,
  });

  if (!hasAccess) {
    return {
      status: 403,
      body: undefined,
    };
  }
};
