import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function CliAuth() {
  const { getToken } = await auth();

  const token = await getToken({
    template: "extended-cli-token",
  });

  if (!token) {
    return null;
  }

  const url = new URL("http://localhost:9999");
  url.searchParams.append("token", token);
  return redirect(url.toString());
}
