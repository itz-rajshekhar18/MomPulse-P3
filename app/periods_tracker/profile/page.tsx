'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to personal info page by default
    router.push('/periods_tracker/profile/personal');
  }, [router]);

  return null;
}
