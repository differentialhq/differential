import { deploymentResultFromNotification } from "./cfn-manager";

describe("deploymentResultFromNotification", () => {
  const stackId = "arn:aws:cloudformation:xxxx";
  const clientRequestToken = "xxxx";
  it("throws if status is missing", () => {
    expect(() => deploymentResultFromNotification({})).toThrow();
  });

  it.each(["CREATE_COMPLETE", "UPDATE_COMPLETE"])(
    "%s status is treated as a success",
    (status) => {
      const result = deploymentResultFromNotification({
        ResourceStatus: status,
        ResourceStatusReason: "",
        ClientRequestToken: clientRequestToken,
        StackId: stackId,
      });
      expect(result).toMatchObject({
        success: true,
        pending: false,
        status,
        stackId,
        clientRequestToken,
      });
    },
  );

  it.each([
    "UPDATE_ROLLBACK_FAILED",
    "ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE",
    "DELETE_COMPLETE",
  ])("%s status is treated as a failure", (status) => {
    const result = deploymentResultFromNotification({
      ResourceStatus: status,
      ResourceStatusReason: "Something went wrong!",
      ClientRequestToken: clientRequestToken,
      StackId: stackId,
    });
    expect(result).toMatchObject({
      success: false,
      pending: false,
      reason: "Something went wrong!",
      status,
      stackId,
      clientRequestToken,
    });
  });
});
