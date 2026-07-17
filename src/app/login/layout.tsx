import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Steward",
  description: "Sign in to Steward, the Certified Fiduciary Services dashboard.",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
