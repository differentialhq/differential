import * as jwt from "./jwt";
import { env } from "../utilities/env";

jest.mock("../utilities/env");

describe("verifyManagementToken", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should verify a correct token", async () => {
    env.IGNORE_EXPIRATION = true;

    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yYTF3ZjlWUWhwbFpXdzZkYlJ1M3NSWTN2RkgiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3MDM1Mzk1NDIsImlhdCI6MTcwMzUzOTQ4MiwiaXNzIjoiaHR0cHM6Ly9odW1hbmUtZ3JvdXBlci05OC5jbGVyay5hY2NvdW50cy5kZXYiLCJuYmYiOjE3MDM1Mzk0NzIsInNpZCI6InNlc3NfMmExeEU4OG02bkVSZmlkQnUyZUxDbjF6dkRxIiwic3ViIjoidXNlcl8yYTF4RTVwdlNUUGxsVng2aTh3Q0E3cFZWSEoifQ.RsNtbucx6zpEemvKlgheDJ4n_ygNKpwiBBVsH_Vnb_jV1z4g7XMGYYmuKlMJLqSqNj2jc96J_VyiULcDlCC2ylEFwuIsPSn8qgsF6M-7LIUsZ9IRosT3m3K0s-wWWXBBOKZsxqD38aUh6A8AKwTNxEgs_JnWmFCdzvlftPmRNd0_QFiOiwTX1PZk3XFG2ETM8t-t9Q8AVf0T09kdrZ6CZphV93VDmCSh7zBouMtitO5hU58GERIomEagRRI-NV4310WT8YNt-XXiG8hIcejIw6wRGyYDdHoV66QJLF9cs8HRjxHLHqVqpJu8QL8yRj6wzFVtj22fE_guYSD1S0bMPQ`;

    const result = await jwt.verifyManagementToken({ managementToken: token });

    expect(result).toEqual({
      userId: "user_2a1xE5pvSTPllVx6i8wCA7pVVHJ",
    });

    // wait for the jwks request to finish
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  it("should throw on a malformed token", async () => {
    const token = `1234`;

    await expect(
      jwt.verifyManagementToken({ managementToken: token }),
    ).rejects.toThrowError("jwt malformed");
  });

  it("should accept a correct management secret", async () => {
    const token =
      "sk_management_98a7oysidtghfkjbaslnd;fuays87otdiygfukahjsbdlf;a;soihudyfgajvshkbdlnf;asdfh";

    env.MANAGEMENT_SECRET = token;

    const result = await jwt.verifyManagementToken({
      managementToken: token,
    });

    expect(result).toEqual({
      userId: "control-plane-administrator",
    });
  });

  it("should throw on an incorrect management secret", async () => {
    const token =
      "sk_management_98a7oysidtghfkjbaslnd;fuays87otdiygfukahjsbdlf;a;soihudyfgajvshkbdlnf;asdfh";

    env.MANAGEMENT_SECRET = token;

    await expect(
      jwt.verifyManagementToken({ managementToken: "sk_management_1234" }),
    ).rejects.toThrowError("Invalid token");
  });
});
