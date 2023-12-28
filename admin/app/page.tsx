import { redirect } from "next/navigation";

const json = require("../package.json");

export default function Home() {
  // redirect to /clusters
  redirect("/clusters");
}
