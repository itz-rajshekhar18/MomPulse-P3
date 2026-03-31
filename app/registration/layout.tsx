import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - MomPulse",
  description: "Login to your MomPulse account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}