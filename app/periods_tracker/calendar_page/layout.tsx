import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar - MomPulse",
  description: "Track your menstrual cycle with MomPulse calendar",
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
