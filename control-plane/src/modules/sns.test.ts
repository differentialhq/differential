import { parseCloudFormationMessage } from "./sns";

describe("parseCloudFormationMessages", () => {
  const testNotification = `
'StackId'='arn:aws:cloudformation:xxxx'
'ResourceStatus'='UPDATE_FAILED'
'ResourceStatusReason'='Something went wrong!'
'ClientRequestToken'='xxxx'
`;
  it("parses the stackName", () => {
    const result = parseCloudFormationMessage(testNotification);
    expect(result.StackId).toBe("arn:aws:cloudformation:xxxx");
    expect(result.ResourceStatus).toBe("UPDATE_FAILED");
    expect(result.ResourceStatusReason).toBe("Something went wrong!");
    expect(result.ClientRequestToken).toBe("xxxx");
  });
});
