import { redirect } from "next/navigation";

export default function Home() {
  // redirect to /clusters
  redirect("/clusters");
}
