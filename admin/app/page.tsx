import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import logo from "./logo.png";
import { redirect } from "next/navigation";

const json = require("../package.json");

export default function Home() {
  // redirect to /clusters
  redirect("/clusters");
}
