import { ClerkProvider, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import logo from "./logo.png";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <Toaster position="top-center" />
          <main className="flex min-h-screen flex-col">
            <header className="flex items-center justify-between w-full h-16 px-8">
              <div className="flex items-center space-x-8">
                <a href="/" className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 -ml-2">
                    <Image src={logo} width={40} height={40} alt={"logo"} />
                    <h1 className="text-2xl">Admin Console</h1>
                    <p className="text-sm text-gray-500 -mt-6">
                      {json.version}
                    </p>
                  </div>
                </a>
                <a
                  href="https://docs.differential.dev"
                  className="text-gray-300"
                >
                  Docs
                </a>
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
