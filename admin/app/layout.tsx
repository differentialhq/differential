import { ClerkProvider, UserButton } from "@clerk/nextjs";
import "flowbite";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import logo from "./logo.png";
import { Toaster } from "react-hot-toast";

const json = require("../package.json");

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Console",
  description: "Admin Console for Differential",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <Toaster position="top-center" />
          <main className="flex min-h-screen flex-col">
            <header className="flex items-center justify-between w-full h-16 px-8">
              <div className="flex items-center space-x-4 -ml-2">
                <Image src={logo} width={40} height={40} alt={"logo"} />
                <h1 className="text-2xl mt-4">Admin Console</h1>
                <p className="text-sm text-gray-700 justify-end">
                  {json.version}
                </p>
              </div>
              <UserButton />
            </header>
            <section>{children}</section>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
